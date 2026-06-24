const db = require('../utils/db');

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await db('suppliers')
      .where('is_active', true)
      .orderBy('supplier_name', 'asc');
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
  }
};

const getSupplierById = async (req, res) => {
  const { id } = req.params;
  try {
    const supplier = await db('suppliers').where({ id }).first();
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching supplier', error: error.message });
  }
};

const createSupplier = async (req, res) => {
  const { supplier_name, gst_number, drug_license_number, email, phone, address } = req.body;

  if (!supplier_name) {
    return res.status(400).json({ message: 'Supplier name is required' });
  }

  try {
    const [supplier] = await db('suppliers').insert({
      supplier_name,
      gst_number,
      drug_license_number,
      email,
      phone,
      address,
      is_active: true
    }).returning('*');

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Error creating supplier', error: error.message });
  }
};

const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { supplier_name, gst_number, drug_license_number, email, phone, address, is_active } = req.body;

  try {
    const updatedRows = await db('suppliers').where({ id }).update({
      supplier_name,
      gst_number,
      drug_license_number,
      email,
      phone,
      address,
      is_active,
      updated_at: db.fn.now()
    });

    if (!updatedRows) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const updatedSupplier = await db('suppliers').where({ id }).first();
    res.json(updatedSupplier);
  } catch (error) {
    res.status(500).json({ message: 'Error updating supplier', error: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedRows = await db('suppliers').where({ id }).update({ is_active: false });
    if (!updatedRows) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting supplier', error: error.message });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};

