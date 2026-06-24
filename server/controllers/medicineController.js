const db = require('../utils/db');

const getMedicines = async (req, res) => {
  const { search, barcode, generic, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = db('medicines').where('is_active', true);

    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
            .orWhere('generic_name', 'ilike', `%${search}%`)
            .orWhere('composition', 'ilike', `%${search}%`);
      });
    }

    if (barcode) {
      query = query.where('barcode', barcode);
    }

    if (generic) {
      query = query.where('generic_name', 'ilike', `%${generic}%`);
    }

    // Get total count
    const countQuery = query.clone();
    const [totalCountResult] = await countQuery.count('id as count');
    const totalCount = parseInt(totalCountResult.count);

    // Get data
    const medicines = await query.orderBy('name', 'asc').limit(limit).offset(offset);

    res.json({
      data: medicines,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching medicines', error: error.message });
  }
};

const getMedicineById = async (req, res) => {
  const { id } = req.params;
  try {
    const medicine = await db('medicines').where({ id }).first();
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching medicine', error: error.message });
  }
};

const createMedicine = async (req, res) => {
  const { 
    name, generic_name, composition, manufacturer, category, 
    barcode, hsn_code, gst_rate, purchase_price, selling_price, mrp 
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Medicine name is required' });
  }

  try {
    const [medicine] = await db('medicines').insert({
      name, generic_name, composition, manufacturer, category, 
      barcode, hsn_code, 
      gst_rate: gst_rate || 0, 
      purchase_price: purchase_price || 0, 
      selling_price: selling_price || 0, 
      mrp: mrp || 0,
      is_active: true
    }).returning('*');

    // Also initialize inventory row
    await db('inventory').insert({
      medicine_id: medicine.id,
      current_stock: 0,
      reserved_stock: 0,
      minimum_stock: 10,
      reorder_level: 15
    });

    res.status(201).json(medicine);
  } catch (error) {
    res.status(500).json({ message: 'Error creating medicine', error: error.message });
  }
};

const updateMedicine = async (req, res) => {
  const { id } = req.params;
  const { 
    name, generic_name, composition, manufacturer, category, 
    barcode, hsn_code, gst_rate, purchase_price, selling_price, mrp, is_active 
  } = req.body;

  try {
    const updatedRows = await db('medicines').where({ id }).update({
      name, generic_name, composition, manufacturer, category, 
      barcode, hsn_code, 
      gst_rate, purchase_price, selling_price, mrp, is_active,
      updated_at: db.fn.now()
    });

    if (!updatedRows) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const updatedMedicine = await db('medicines').where({ id }).first();
    res.json(updatedMedicine);
  } catch (error) {
    res.status(500).json({ message: 'Error updating medicine', error: error.message });
  }
};

const deleteMedicine = async (req, res) => {
  const { id } = req.params;
  try {
    // Soft delete by setting is_active to false
    const updatedRows = await db('medicines').where({ id }).update({ is_active: false });
    if (!updatedRows) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting medicine', error: error.message });
  }
};

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine
};

