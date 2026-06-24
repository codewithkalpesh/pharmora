exports.seed = async function(knex) {
  // Clear tables in reverse dependency order
  await knex('audit_logs').del();
  await knex('notifications').del();
  await knex('expenses').del();
  await knex('prescriptions').del();
  await knex('sale_items').del();
  await knex('sales').del();
  await knex('customers').del();
  await knex('purchase_items').del();
  await knex('purchases').del();
  await knex('batches').del();
  await knex('inventory').del();
  await knex('medicines').del();
  await knex('suppliers').del();

  // 1. Seed Suppliers
  const [sup1, sup2] = await knex('suppliers').insert([
    {
      supplier_name: 'Apex Healthcare Distributors',
      gst_number: '27AAAAA1111A1Z1',
      drug_license_number: 'DL-12345-PD',
      email: 'sales@apexhealth.com',
      phone: '+91 98765 43210',
      address: 'Plot 42, GIDC Industrial Estate, Mumbai, MH',
      is_active: true
    },
    {
      supplier_name: 'Medilife Pharma Logics',
      gst_number: '27BBBBB2222B2Z2',
      drug_license_number: 'DL-67890-PD',
      email: 'info@medilife.com',
      phone: '+91 87654 32109',
      address: 'Building B3, Sector 10, Noida, UP',
      is_active: true
    }
  ]).returning('*');

  // 2. Seed Medicines
  const [med1, med2, med3, med4] = await knex('medicines').insert([
    {
      name: 'Paracetamol 650mg (Dolo)',
      generic_name: 'Paracetamol',
      composition: 'Paracetamol 650mg',
      manufacturer: 'Micro Labs Ltd',
      category: 'Analgesics / Antipyretics',
      barcode: '8901123456789',
      hsn_code: '30049011',
      gst_rate: 12.00,
      purchase_price: 22.50,
      selling_price: 30.24,
      mrp: 30.24,
      is_active: true
    },
    {
      name: 'Amoxicillin 500mg (Novamox)',
      generic_name: 'Amoxicillin',
      composition: 'Amoxicillin Trihydrate 500mg',
      manufacturer: 'Cipla Ltd',
      category: 'Antibiotics',
      barcode: '8902234567890',
      hsn_code: '30041010',
      gst_rate: 12.00,
      purchase_price: 85.00,
      selling_price: 110.00,
      mrp: 110.00,
      is_active: true
    },
    {
      name: 'Atorvastatin 10mg (Lipvas)',
      generic_name: 'Atorvastatin',
      composition: 'Atorvastatin Calcium 10mg',
      manufacturer: 'Cipla Ltd',
      category: 'Cardiovascular',
      barcode: '8903345678901',
      hsn_code: '30049099',
      gst_rate: 12.00,
      purchase_price: 65.00,
      selling_price: 89.50,
      mrp: 89.50,
      is_active: true
    },
    {
      name: 'Metformin 500mg (Glycomet)',
      generic_name: 'Metformin',
      composition: 'Metformin Hydrochloride 500mg',
      manufacturer: 'USV Private Ltd',
      category: 'Antidiabetics',
      barcode: '8904456789012',
      hsn_code: '30049085',
      gst_rate: 12.00,
      purchase_price: 18.00,
      selling_price: 25.00,
      mrp: 25.00,
      is_active: true
    }
  ]).returning('*');

  // 3. Seed Inventory (aggregated stock status)
  await knex('inventory').insert([
    {
      medicine_id: med1.id,
      current_stock: 150,
      reserved_stock: 0,
      minimum_stock: 50,
      reorder_level: 60
    },
    {
      medicine_id: med2.id,
      current_stock: 12, // Low Stock!
      reserved_stock: 0,
      minimum_stock: 20,
      reorder_level: 25
    },
    {
      medicine_id: med3.id,
      current_stock: 80,
      reserved_stock: 0,
      minimum_stock: 15,
      reorder_level: 20
    },
    {
      medicine_id: med4.id,
      current_stock: 200,
      reserved_stock: 0,
      minimum_stock: 30,
      reorder_level: 40
    }
  ]);

  // 4. Seed Batches (batch-level details)
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  
  await knex('batches').insert([
    {
      medicine_id: med1.id,
      batch_number: 'B-DOLO101',
      manufacturing_date: '2025-06-01',
      expiry_date: nextYear.toISOString().split('T')[0],
      quantity: 150,
      purchase_rate: 22.50,
      mrp: 30.24,
      selling_price: 30.24
    },
    {
      medicine_id: med2.id,
      batch_number: 'B-AMX998',
      manufacturing_date: '2025-02-15',
      expiry_date: nextMonth.toISOString().split('T')[0], // Near Expiry!
      quantity: 12,
      purchase_rate: 85.00,
      mrp: 110.00,
      selling_price: 110.00
    },
    {
      medicine_id: med3.id,
      batch_number: 'B-ATV332',
      manufacturing_date: '2025-04-10',
      expiry_date: nextYear.toISOString().split('T')[0],
      quantity: 80,
      purchase_rate: 65.00,
      mrp: 89.50,
      selling_price: 89.50
    },
    {
      medicine_id: med4.id,
      batch_number: 'B-MET404',
      manufacturing_date: '2025-01-01',
      expiry_date: nextYear.toISOString().split('T')[0],
      quantity: 200,
      purchase_rate: 18.00,
      mrp: 25.00,
      selling_price: 25.00
    }
  ]);

  // 5. Seed Customers
  await knex('customers').insert([
    {
      customer_name: 'Rahul Sharma',
      mobile: '+91 99999 88888',
      email: 'rahul.sharma@example.com',
      address: 'Flat 101, Sun City, Pune, MH',
      loyalty_points: 120,
      credit_balance: 0.00
    },
    {
      customer_name: 'Priya Patel',
      mobile: '+91 88888 77777',
      email: 'priya.patel@example.com',
      address: 'Block C, Silver Crest, Ahmedabad, GJ',
      loyalty_points: 45,
      credit_balance: 150.00 // Outstanding credit
    }
  ]);

  // 6. Seed Notifications
  await knex('notifications').insert([
    {
      title: 'Low Stock Alert',
      message: 'Amoxicillin 500mg (Novamox) is running low. Current stock is 12 units (Minimum: 20).',
      type: 'LowStock',
      is_read: false
    },
    {
      title: 'Near Expiry Warning',
      message: 'Batch B-AMX998 of Amoxicillin 500mg (Novamox) is expiring soon (next 30 days).',
      type: 'NearExpiry',
      is_read: false
    }
  ]);
};
