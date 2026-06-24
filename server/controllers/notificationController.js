const db = require('../utils/db');

const getNotifications = async (req, res) => {
  try {
    const notifications = await db('notifications')
      .where('is_read', false)
      .orderBy('created_at', 'desc');
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db('notifications').where({ id }).update({ is_read: true });
    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification status', error: error.message });
  }
};

const scanForAlerts = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + 60);
    const expiryThresholdStr = expiryThreshold.toISOString().split('T')[0];

    // 1. Scan Low Stock & Out of Stock
    const inventoryItems = await db('inventory')
      .join('medicines', 'inventory.medicine_id', 'medicines.id')
      .select('inventory.*', 'medicines.name')
      .where('medicines.is_active', true);

    for (const item of inventoryItems) {
      if (item.current_stock === 0) {
        // Out of stock alert
        const message = `Medicine "${item.name}" is completely Out of Stock!`;
        const exists = await db('notifications').where({ message, is_read: false }).first();
        if (!exists) {
          await db('notifications').insert({
            title: 'Out of Stock Alert',
            message,
            type: 'LowStock',
            is_read: false
          });
        }
      } else if (item.current_stock <= 1) {
        // Low stock alert
        const message = `Medicine "${item.name}" is low on stock (${item.current_stock} remaining, minimum: 1)`;
        const exists = await db('notifications').where({ message, is_read: false }).first();
        if (!exists) {
          await db('notifications').insert({
            title: 'Low Stock Alert',
            message,
            type: 'LowStock',
            is_read: false
          });
        }
      }
    }

    // 2. Scan Expiry
    const batches = await db('batches')
      .join('medicines', 'batches.medicine_id', 'medicines.id')
      .select('batches.*', 'medicines.name')
      .where('batches.quantity', '>', 0);

    for (const batch of batches) {
      if (batch.expiry_date < todayStr) {
        // Expired
        const message = `Batch ${batch.batch_number} of "${batch.name}" has expired!`;
        const exists = await db('notifications').where({ message, is_read: false }).first();
        if (!exists) {
          await db('notifications').insert({
            title: 'Expired Batch Warning',
            message,
            type: 'NearExpiry',
            is_read: false
          });
        }
      } else if (batch.expiry_date <= expiryThresholdStr) {
        // Expiring soon
        const message = `Batch ${batch.batch_number} of "${batch.name}" will expire soon (Expiry: ${batch.expiry_date})`;
        const exists = await db('notifications').where({ message, is_read: false }).first();
        if (!exists) {
          await db('notifications').insert({
            title: 'Near Expiry Alert',
            message,
            type: 'NearExpiry',
            is_read: false
          });
        }
      }
    }

    // 3. Scan Customer Due Credits
    const customers = await db('customers').where('credit_balance', '>', 0);
    for (const customer of customers) {
      const message = `Customer "${customer.customer_name}" has an outstanding credit balance of ₹${customer.credit_balance}`;
      const exists = await db('notifications').where({ message, is_read: false }).first();
      if (!exists) {
        await db('notifications').insert({
          title: 'Outstanding Balance Alert',
          message,
          type: 'PaymentDue',
          is_read: false
        });
      }
    }

    const latestNotifications = await db('notifications')
      .where('is_read', false)
      .orderBy('created_at', 'desc');

    res.json({ message: 'Alert scan completed successfully', count: latestNotifications.length, data: latestNotifications });
  } catch (error) {
    res.status(500).json({ message: 'Error scanning for alerts', error: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  scanForAlerts
};

