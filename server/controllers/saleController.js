const db = require('../utils/db');

const getSales = async (req, res) => {
  try {
    const sales = await db('sales')
      .leftJoin('customers', 'sales.customer_id', 'customers.id')
      .select('sales.*', 'customers.customer_name', 'customers.mobile')
      .orderBy('sales.created_at', 'desc');
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales history', error: error.message });
  }
};

const getSaleById = async (req, res) => {
  const { id } = req.params;
  try {
    const sale = await db('sales')
      .leftJoin('customers', 'sales.customer_id', 'customers.id')
      .select('sales.*', 'customers.customer_name', 'customers.mobile', 'customers.email')
      .where('sales.id', id)
      .first();

    if (!sale) {
      return res.status(404).json({ message: 'Sale invoice not found' });
    }

    const items = await db('sale_items')
      .join('medicines', 'sale_items.medicine_id', 'medicines.id')
      .leftJoin('batches', 'sale_items.batch_id', 'batches.id')
      .select(
        'sale_items.*',
        'medicines.name as medicine_name',
        'medicines.generic_name',
        'batches.batch_number'
      )
      .where('sale_items.sale_id', id);

    res.json({ ...sale, items });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sale invoice details', error: error.message });
  }
};

const createSale = async (req, res) => {
  const { customer_id, subtotal, gst_amount, discount_amount, total_amount, payment_method, items } = req.body;
  const userId = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'At least one medicine item is required to check out.' });
  }

  const trx = await db.transaction();

  try {
    // Generate simple invoice number: INV-TIMESTAMP-RANDOM
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Insert Sales Header
    const [sale] = await trx('sales').insert({
      invoice_number: invoiceNumber,
      customer_id: customer_id || null,
      subtotal: subtotal || 0,
      gst_amount: gst_amount || 0,
      discount_amount: discount_amount || 0,
      total_amount: total_amount || 0,
      payment_method: payment_method || 'Cash',
      payment_status: payment_method === 'Credit' ? 'Pending' : 'Paid',
      created_by: userId
    }).returning('*');

    // 2. Loop through sale items
    for (const item of items) {
      const { medicine_id, batch_id, quantity, rate, gst_rate, discount } = item;

      if (!medicine_id || !batch_id || !quantity) {
        throw new Error('medicine_id, batch_id, and quantity are required for each line item.');
      }

      // Check batch quantity
      const batch = await trx('batches').where({ id: batch_id }).first();
      if (!batch || batch.quantity < quantity) {
        // Find batch number/name for error clarity
        const med = await trx('medicines').where({ id: medicine_id }).first();
        throw new Error(`Insufficient stock for ${med ? med.name : 'Medicine'} (Batch: ${batch ? batch.batch_number : 'Unknown'}). Available: ${batch ? batch.quantity : 0}`);
      }

      // Decrement Batch Quantity
      await trx('batches').where({ id: batch_id }).update({
        quantity: batch.quantity - quantity,
        updated_at: trx.fn.now()
      });

      // Decrement aggregated medicine inventory
      const inventory = await trx('inventory').where({ medicine_id }).first();
      if (inventory) {
        const newStock = Math.max(0, inventory.current_stock - quantity);
        await trx('inventory').where({ medicine_id }).update({
          current_stock: newStock,
          updated_at: trx.fn.now()
        });

        // Trigger low stock notification check
        if (newStock <= 1) {
          const med = await trx('medicines').where({ id: medicine_id }).first();
          
          // Check if notification already exists for this low stock event
          const existingNotif = await trx('notifications')
            .where({ type: 'LowStock', is_read: false })
            .andWhere('message', 'like', `%${med.name}%`)
            .first();

          if (!existingNotif) {
            await trx('notifications').insert({
              title: 'Low Stock Alert',
              message: `Medicine "${med.name}" has reached low stock. Current level: ${newStock} units (Minimum required: 1).`,
              type: 'LowStock',
              is_read: false
            });
          }
        }
      }

      // Calculate total for item
      const itemTotal = (rate * quantity) - (discount || 0);

      // Insert sale item details
      await trx('sale_items').insert({
        sale_id: sale.id,
        medicine_id,
        batch_id,
        quantity,
        rate,
        gst_rate: gst_rate || 0,
        discount: discount || 0,
        total: itemTotal
      });
    }

    // 3. Customer loyalty points and credit tracker
    if (customer_id) {
      const customer = await trx('customers').where({ id: customer_id }).first();
      if (customer) {
        let updatedBalance = parseFloat(customer.credit_balance);
        if (payment_method === 'Credit') {
          updatedBalance += parseFloat(total_amount);
        }

        // 1 loyalty point for every ₹100 spent
        const pointsEarned = Math.floor(total_amount / 100);

        await trx('customers').where({ id: customer_id }).update({
          credit_balance: updatedBalance,
          loyalty_points: customer.loyalty_points + pointsEarned,
          updated_at: trx.fn.now()
        });
      }
    }

    // 4. Audit logging
    await trx('audit_logs').insert({
      user_id: userId,
      action: `Created Sale Invoice ${invoiceNumber}`,
      module: 'Sales',
      details: `Sale ID: ${sale.id}. Invoice Total: ₹${total_amount}`
    });

    await trx.commit();
    res.status(201).json(sale);
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ message: 'Error processing sale transaction', error: error.message });
  }
};

const returnSale = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const trx = await db.transaction();

  try {
    const sale = await trx('sales').where({ id }).first();
    if (!sale) {
      await trx.rollback();
      return res.status(404).json({ message: 'Sale invoice not found' });
    }

    if (sale.payment_status === 'Refunded') {
      await trx.rollback();
      return res.status(400).json({ message: 'Invoice is already refunded' });
    }

    const items = await trx('sale_items').where({ sale_id: id });

    // Return items to batches and inventory
    for (const item of items) {
      if (item.batch_id) {
        const batch = await trx('batches').where({ id: item.batch_id }).first();
        if (batch) {
          await trx('batches').where({ id: item.batch_id }).update({
            quantity: batch.quantity + item.quantity
          });
        }
      }

      const inventory = await trx('inventory').where({ medicine_id: item.medicine_id }).first();
      if (inventory) {
        await trx('inventory').where({ medicine_id: item.medicine_id }).update({
          current_stock: inventory.current_stock + item.quantity
        });
      }
    }

    // Revert loyalty points/credits if customer is linked
    if (sale.customer_id) {
      const customer = await trx('customers').where({ id: sale.customer_id }).first();
      if (customer) {
        const pointsToDeduct = Math.floor(sale.total_amount / 100);
        let updatedBalance = parseFloat(customer.credit_balance);
        if (sale.payment_method === 'Credit') {
          updatedBalance = Math.max(0, updatedBalance - parseFloat(sale.total_amount));
        }

        await trx('customers').where({ id: sale.customer_id }).update({
          credit_balance: updatedBalance,
          loyalty_points: Math.max(0, customer.loyalty_points - pointsToDeduct)
        });
      }
    }

    // Update status
    await trx('sales').where({ id }).update({
      payment_status: 'Refunded'
    });

    await trx('audit_logs').insert({
      user_id: userId,
      action: `Refunded Sale Invoice ${sale.invoice_number}`,
      module: 'Sales',
      details: `Sale ID: ${id}. Amount Refunded: ₹${sale.total_amount}`
    });

    await trx.commit();
    res.json({ message: 'Sale invoice refunded successfully and stocks restored.' });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ message: 'Error refunding sale invoice', error: error.message });
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  returnSale
};

