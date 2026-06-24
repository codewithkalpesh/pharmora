const db = require('../utils/db');

const getInventory = async (req, res) => {
  try {
    const stock = await db('inventory')
      .join('medicines', 'inventory.medicine_id', 'medicines.id')
      .select(
        'inventory.*',
        'medicines.name as medicine_name',
        'medicines.generic_name',
        'medicines.category',
        'medicines.purchase_price',
        'medicines.selling_price',
        'medicines.mrp'
      )
      .where('medicines.is_active', true)
      .orderBy('medicines.name', 'asc');

    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
};

const getLowStock = async (req, res) => {
  try {
    const lowStock = await db('inventory')
      .join('medicines', 'inventory.medicine_id', 'medicines.id')
      .select(
        'inventory.*',
        'medicines.name as medicine_name',
        'medicines.generic_name',
        'medicines.category'
      )
      .where('medicines.is_active', true)
      .andWhere(function() {
        this.whereRaw('inventory.current_stock <= 1');
      })
      .orderBy('medicines.name', 'asc');

    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching low stock items', error: error.message });
  }
};

const getNearExpiry = async (req, res) => {
  const { days = 30 } = req.query;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + parseInt(days));

  try {
    const nearExpiry = await db('batches')
      .join('medicines', 'batches.medicine_id', 'medicines.id')
      .select(
        'batches.*',
        'medicines.name as medicine_name',
        'medicines.generic_name',
        'medicines.category'
      )
      .where('medicines.is_active', true)
      .andWhere('batches.quantity', '>', 0)
      .andWhere('batches.expiry_date', '<=', targetDate.toISOString().split('T')[0])
      .andWhere('batches.expiry_date', '>=', new Date().toISOString().split('T')[0])
      .orderBy('batches.expiry_date', 'asc');

    res.json(nearExpiry);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching near expiry batches', error: error.message });
  }
};

const getBatchesByMedicine = async (req, res) => {
  const { medicine_id } = req.params;
  try {
    const batches = await db('batches')
      .where({ medicine_id })
      .andWhere('quantity', '>', 0)
      .orderBy('expiry_date', 'asc');
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching batches', error: error.message });
  }
};

const adjustStock = async (req, res) => {
  const { medicine_id, adjustment_type, quantity, notes } = req.body;
  const userId = req.user.id;

  if (!medicine_id || !adjustment_type || !quantity) {
    return res.status(400).json({ message: 'medicine_id, adjustment_type, and quantity are required' });
  }

  const trx = await db.transaction();

  try {
    const inventory = await trx('inventory').where({ medicine_id }).first();
    if (!inventory) {
      await trx.rollback();
      return res.status(404).json({ message: 'Inventory record not found' });
    }

    let newStock = inventory.current_stock;
    if (adjustment_type === 'Add') {
      newStock += parseInt(quantity);
    } else if (adjustment_type === 'Subtract') {
      newStock -= parseInt(quantity);
    } else {
      await trx.rollback();
      return res.status(400).json({ message: 'Invalid adjustment type. Must be Add or Subtract' });
    }

    if (newStock < 0) {
      await trx.rollback();
      return res.status(400).json({ message: 'Adjustment cannot lead to negative stock' });
    }

    await trx('inventory').where({ medicine_id }).update({
      current_stock: newStock,
      updated_at: trx.fn.now()
    });

    // Log the audit
    await trx('audit_logs').insert({
      user_id: userId,
      action: `Stock adjusted by ${quantity} (${adjustment_type})`,
      module: 'Inventory',
      details: `Medicine ID: ${medicine_id}. Notes: ${notes || 'None'}`
    });

    await trx.commit();
    res.json({ message: 'Stock adjusted successfully', current_stock: newStock });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ message: 'Error adjusting stock', error: error.message });
  }
};

module.exports = {
  getInventory,
  getLowStock,
  getNearExpiry,
  getBatchesByMedicine,
  adjustStock
};

