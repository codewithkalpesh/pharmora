const db = require('../utils/db');

const getPurchases = async (req, res) => {
  try {
    const purchases = await db('purchases')
      .join('suppliers', 'purchases.supplier_id', 'suppliers.id')
      .select('purchases.*', 'suppliers.supplier_name')
      .orderBy('purchases.created_at', 'desc');
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching purchases', error: error.message });
  }
};

const getPurchaseById = async (req, res) => {
  const { id } = req.params;
  try {
    const purchase = await db('purchases')
      .join('suppliers', 'purchases.supplier_id', 'suppliers.id')
      .select('purchases.*', 'suppliers.supplier_name')
      .where('purchases.id', id)
      .first();

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    const items = await db('purchase_items')
      .join('medicines', 'purchase_items.medicine_id', 'medicines.id')
      .leftJoin('batches', 'purchase_items.batch_id', 'batches.id')
      .select(
        'purchase_items.*', 
        'medicines.name as medicine_name', 
        'medicines.generic_name',
        'batches.batch_number',
        'batches.expiry_date'
      )
      .where('purchase_items.purchase_id', id);

    res.json({ ...purchase, items });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching purchase details', error: error.message });
  }
};

const createPurchase = async (req, res) => {
  const { supplier_id, invoice_number, invoice_date, subtotal, gst_amount, total_amount, items } = req.body;
  const userId = req.user.id;

  if (!supplier_id || !invoice_number || !items || items.length === 0) {
    return res.status(400).json({ message: 'supplier_id, invoice_number, and items list are required' });
  }

  const trx = await db.transaction();

  try {
    // 1. Insert primary purchase record
    const [purchase] = await trx('purchases').insert({
      supplier_id,
      invoice_number,
      invoice_date: invoice_date || new Date().toISOString().split('T')[0],
      subtotal: subtotal || 0,
      gst_amount: gst_amount || 0,
      total_amount: total_amount || 0,
      status: 'Completed',
      created_by: userId
    }).returning('*');

    // 2. Loop through each item to update inventory/batches
    for (const item of items) {
      const { medicine_id, batch_number, manufacturing_date, expiry_date, quantity, purchase_rate, mrp, selling_price, gst_rate } = item;

      if (!medicine_id || !batch_number || !quantity) {
        throw new Error('medicine_id, batch_number, and quantity are required for each purchase line item.');
      }

      // Check if this batch already exists for the medicine
      let batch = await trx('batches').where({ medicine_id, batch_number }).first();
      
      if (batch) {
        // Increment batch quantity
        await trx('batches').where({ id: batch.id }).update({
          quantity: batch.quantity + parseInt(quantity),
          purchase_rate: purchase_rate || batch.purchase_rate,
          mrp: mrp || batch.mrp,
          selling_price: selling_price || batch.selling_price,
          expiry_date: expiry_date || batch.expiry_date,
          updated_at: trx.fn.now()
        });
      } else {
        // Insert new batch
        const [newBatch] = await trx('batches').insert({
          medicine_id,
          batch_number,
          manufacturing_date,
          expiry_date,
          quantity,
          purchase_rate: purchase_rate || 0,
          mrp: mrp || 0,
          selling_price: selling_price || 0
        }).returning('*');
        batch = newBatch;
      }

      // Adjust aggregate medicine inventory
      const inventory = await trx('inventory').where({ medicine_id }).first();
      if (inventory) {
        await trx('inventory').where({ medicine_id }).update({
          current_stock: inventory.current_stock + parseInt(quantity),
          updated_at: trx.fn.now()
        });
      } else {
        await trx('inventory').insert({
          medicine_id,
          current_stock: quantity,
          reserved_stock: 0,
          minimum_stock: 10,
          reorder_level: 15
        });
      }

      // Also update default prices in medicines table if needed
      await trx('medicines').where({ id: medicine_id }).update({
        purchase_price: purchase_rate || 0,
        selling_price: selling_price || 0,
        mrp: mrp || 0
      });

      // Insert purchase item record
      await trx('purchase_items').insert({
        purchase_id: purchase.id,
        medicine_id,
        batch_id: batch.id,
        quantity,
        purchase_rate: purchase_rate || 0,
        gst_rate: gst_rate || 0,
        total: (purchase_rate || 0) * quantity
      });
    }

    // Log the transaction
    await trx('audit_logs').insert({
      user_id: userId,
      action: `Created Purchase Invoice ${invoice_number}`,
      module: 'Purchases',
      details: `Purchase ID: ${purchase.id}. Total: ₹${total_amount}`
    });

    await trx.commit();
    res.status(201).json(purchase);
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ message: 'Error processing purchase order', error: error.message });
  }
};

const returnPurchase = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const trx = await db.transaction();

  try {
    const purchase = await trx('purchases').where({ id }).first();
    if (!purchase) {
      await trx.rollback();
      return res.status(404).json({ message: 'Purchase not found' });
    }

    if (purchase.status === 'Returned') {
      await trx.rollback();
      return res.status(400).json({ message: 'Purchase is already marked as returned' });
    }

    // Fetch items
    const items = await trx('purchase_items').where({ purchase_id: id });

    // Revert inventory and batch quantities
    for (const item of items) {
      if (item.batch_id) {
        const batch = await trx('batches').where({ id: item.batch_id }).first();
        if (batch) {
          const newQty = Math.max(0, batch.quantity - item.quantity);
          await trx('batches').where({ id: batch.id }).update({ quantity: newQty });
        }
      }

      const inventory = await trx('inventory').where({ medicine_id: item.medicine_id }).first();
      if (inventory) {
        const newStock = Math.max(0, inventory.current_stock - item.quantity);
        await trx('inventory').where({ medicine_id: item.medicine_id }).update({ current_stock: newStock });
      }
    }

    // Update purchase status
    await trx('purchases').where({ id }).update({
      status: 'Returned',
      updated_at: trx.fn.now()
    });

    await trx('audit_logs').insert({
      user_id: userId,
      action: `Returned Purchase Invoice ${purchase.invoice_number}`,
      module: 'Purchases',
      details: `Purchase ID: ${id}. Amount Reverted: ₹${purchase.total_amount}`
    });

    await trx.commit();
    res.json({ message: 'Purchase order returned successfully and stocks updated.' });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ message: 'Error returning purchase order', error: error.message });
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  returnPurchase
};

