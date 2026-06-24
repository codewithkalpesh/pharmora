const db = require('../utils/db');

const getSalesReport = async (req, res) => {
  const { period = 'daily' } = req.query;
  try {
    let salesReport;
    if (period === 'monthly') {
      salesReport = await db('sales')
        .select(
          db.raw("to_char(created_at, 'YYYY-MM') as period"),
          db.raw('count(id) as transactions'),
          db.raw('sum(subtotal) as subtotal'),
          db.raw('sum(gst_amount) as gst'),
          db.raw('sum(discount_amount) as discount'),
          db.raw('sum(total_amount) as total')
        )
        .whereNot('payment_status', 'Refunded')
        .groupBy(db.raw("to_char(created_at, 'YYYY-MM')"))
        .orderBy('period', 'desc');
    } else {
      // Default to daily
      salesReport = await db('sales')
        .select(
          db.raw("created_at::date as period"),
          db.raw('count(id) as transactions'),
          db.raw('sum(subtotal) as subtotal'),
          db.raw('sum(gst_amount) as gst'),
          db.raw('sum(discount_amount) as discount'),
          db.raw('sum(total_amount) as total')
        )
        .whereNot('payment_status', 'Refunded')
        .groupBy(db.raw("created_at::date"))
        .orderBy('period', 'desc');
    }
    res.json(salesReport);
  } catch (error) {
    res.status(500).json({ message: 'Error generating sales report', error: error.message });
  }
};

const getPurchaseReport = async (req, res) => {
  const { period = 'daily' } = req.query;
  try {
    let purchaseReport;
    if (period === 'monthly') {
      purchaseReport = await db('purchases')
        .select(
          db.raw("to_char(created_at, 'YYYY-MM') as period"),
          db.raw('count(id) as count'),
          db.raw('sum(subtotal) as subtotal'),
          db.raw('sum(gst_amount) as gst'),
          db.raw('sum(total_amount) as total')
        )
        .whereNot('status', 'Returned')
        .groupBy(db.raw("to_char(created_at, 'YYYY-MM')"))
        .orderBy('period', 'desc');
    } else {
      purchaseReport = await db('purchases')
        .select(
          db.raw("created_at::date as period"),
          db.raw('count(id) as count'),
          db.raw('sum(subtotal) as subtotal'),
          db.raw('sum(gst_amount) as gst'),
          db.raw('sum(total_amount) as total')
        )
        .whereNot('status', 'Returned')
        .groupBy(db.raw("created_at::date"))
        .orderBy('period', 'desc');
    }
    res.json(purchaseReport);
  } catch (error) {
    res.status(500).json({ message: 'Error generating purchase report', error: error.message });
  }
};

const getProfitReport = async (req, res) => {
  try {
    const profitData = await db('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('medicines', 'sale_items.medicine_id', 'medicines.id')
      .leftJoin('batches', 'sale_items.batch_id', 'batches.id')
      .select(
        db.raw("sales.created_at::date as date"),
        db.raw('sum(sale_items.total) as revenue'),
        db.raw('sum(coalesce(batches.purchase_rate, medicines.purchase_price) * sale_items.quantity) as cost'),
        db.raw('sum(sale_items.total) - sum(coalesce(batches.purchase_rate, medicines.purchase_price) * sale_items.quantity) as profit')
      )
      .whereNot('sales.payment_status', 'Refunded')
      .groupBy(db.raw("sales.created_at::date"))
      .orderBy('date', 'desc');

    res.json(profitData);
  } catch (error) {
    res.status(500).json({ message: 'Error generating profit report', error: error.message });
  }
};

const getStockReport = async (req, res) => {
  try {
    const categoryData = await db('inventory')
      .join('medicines', 'inventory.medicine_id', 'medicines.id')
      .select(
        'medicines.category',
        db.raw('count(medicines.id) as unique_medicines'),
        db.raw('sum(inventory.current_stock) as total_stock'),
        db.raw('sum(inventory.current_stock * medicines.purchase_price) as asset_value')
      )
      .where('medicines.is_active', true)
      .groupBy('medicines.category')
      .orderBy('asset_value', 'desc');

    const totalStatsResult = await db('inventory')
      .join('medicines', 'inventory.medicine_id', 'medicines.id')
      .select(
        db.raw('sum(inventory.current_stock) as total_qty'),
        db.raw('sum(inventory.current_stock * medicines.purchase_price) as total_value'),
        db.raw('sum(inventory.current_stock * medicines.selling_price) as total_selling_value')
      )
      .where('medicines.is_active', true)
      .first();

    res.json({
      summary: {
        totalItems: parseInt(totalStatsResult.total_qty || 0),
        totalAssetValue: parseFloat(totalStatsResult.total_value || 0),
        totalRetailValue: parseFloat(totalStatsResult.total_selling_value || 0)
      },
      categories: categoryData
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating stock report', error: error.message });
  }
};

const getExpiryReport = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const next60Days = new Date();
    next60Days.setDate(next60Days.getDate() + 60);
    const next60DaysStr = next60Days.toISOString().split('T')[0];

    // Already Expired
    const expired = await db('batches')
      .join('medicines', 'batches.medicine_id', 'medicines.id')
      .select('batches.*', 'medicines.name as medicine_name', 'medicines.generic_name')
      .where('batches.quantity', '>', 0)
      .andWhere('batches.expiry_date', '<', todayStr)
      .orderBy('batches.expiry_date', 'asc');

    // Expiring within 60 days
    const expiringSoon = await db('batches')
      .join('medicines', 'batches.medicine_id', 'medicines.id')
      .select('batches.*', 'medicines.name as medicine_name', 'medicines.generic_name')
      .where('batches.quantity', '>', 0)
      .andWhere('batches.expiry_date', '>=', todayStr)
      .andWhere('batches.expiry_date', '<=', next60DaysStr)
      .orderBy('batches.expiry_date', 'asc');

    res.json({ expired, expiringSoon });
  } catch (error) {
    res.status(500).json({ message: 'Error generating expiry report', error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().split('T')[0];

    // Today's Sales
    const salesResult = await db('sales')
      .whereRaw('created_at::date = ?', [today])
      .whereNot('payment_status', 'Refunded')
      .sum('total_amount as total');
    const todaySales = parseFloat(salesResult[0].total || 0);

    // Today's Purchases
    const purchasesResult = await db('purchases')
      .whereRaw('created_at::date = ?', [today])
      .whereNot('status', 'Returned')
      .sum('total_amount as total');
    const todayPurchases = parseFloat(purchasesResult[0].total || 0);

    // Today's Profit
    const profitResult = await db('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('medicines', 'sale_items.medicine_id', 'medicines.id')
      .leftJoin('batches', 'sale_items.batch_id', 'batches.id')
      .whereRaw('sales.created_at::date = ?', [today])
      .whereNot('sales.payment_status', 'Refunded')
      .select(
        db.raw('sum(sale_items.total) - sum(coalesce(batches.purchase_rate, medicines.purchase_price) * sale_items.quantity) as profit')
      )
      .first();
    const todayProfit = parseFloat(profitResult?.profit || 0);

    // Total Inventory Asset Value
    const inventoryResult = await db('inventory')
      .join('medicines', 'inventory.medicine_id', 'medicines.id')
      .where('medicines.is_active', true)
      .select(db.raw('sum(inventory.current_stock * medicines.purchase_price) as total'))
      .first();
    const totalInventoryValue = parseFloat(inventoryResult?.total || 0);

    // Low Stock Count
    const lowStockResult = await db('inventory')
      .join('medicines', 'inventory.medicine_id', 'medicines.id')
      .where('medicines.is_active', true)
      .andWhereRaw('inventory.current_stock <= 1')
      .count('inventory.id as count');
    const lowStockCount = parseInt(lowStockResult[0].count || 0);

    // Near Expiry Count (next 60 days)
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    const sixtyDaysStr = sixtyDaysFromNow.toISOString().split('T')[0];
    const expiryResult = await db('batches')
      .join('medicines', 'batches.medicine_id', 'medicines.id')
      .where('medicines.is_active', true)
      .andWhere('batches.quantity', '>', 0)
      .andWhere('batches.expiry_date', '<=', sixtyDaysStr)
      .count('batches.id as count');
    const nearExpiryCount = parseInt(expiryResult[0].count || 0);

    // Top Selling Medicines
    const topSelling = await db('sale_items')
      .join('medicines', 'sale_items.medicine_id', 'medicines.id')
      .select('medicines.name', 'medicines.generic_name')
      .sum('sale_items.quantity as qty_sold')
      .groupBy('medicines.name', 'medicines.generic_name')
      .orderBy('qty_sold', 'desc')
      .limit(5);

    res.json({
      todaySales,
      todayPurchases,
      todayProfit,
      totalInventoryValue,
      lowStockCount,
      nearExpiryCount,
      topSelling
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

module.exports = {
  getSalesReport,
  getPurchaseReport,
  getProfitReport,
  getStockReport,
  getExpiryReport,
  getDashboardStats
};

