const db = require('../utils/db');

const getCustomers = async (req, res) => {
  try {
    const customers = await db('customers').orderBy('customer_name', 'asc');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
};

const getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await db('customers').where({ id }).first();
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Include purchase history
    const sales = await db('sales')
      .where({ customer_id: id })
      .orderBy('created_at', 'desc')
      .limit(10);

    res.json({ ...customer, sales });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer profile', error: error.message });
  }
};

const createCustomer = async (req, res) => {
  const { customer_name, mobile, email, address, credit_balance } = req.body;

  if (!customer_name) {
    return res.status(400).json({ message: 'Customer name is required' });
  }

  try {
    const [customer] = await db('customers').insert({
      customer_name,
      mobile,
      email,
      address,
      loyalty_points: 0,
      credit_balance: credit_balance || 0.00
    }).returning('*');

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { customer_name, mobile, email, address, loyalty_points, credit_balance } = req.body;

  try {
    const updatedRows = await db('customers').where({ id }).update({
      customer_name,
      mobile,
      email,
      address,
      loyalty_points,
      credit_balance,
      updated_at: db.fn.now()
    });

    if (!updatedRows) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updatedCustomer = await db('customers').where({ id }).first();
    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await db('customers').where({ id }).del();
    if (!deleted) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};

