exports.up = function(knex) {
  return knex.schema
    .createTable('suppliers', table => {
      table.increments('id').primary();
      table.string('supplier_name').notNullable();
      table.string('gst_number');
      table.string('drug_license_number');
      table.string('email');
      table.string('phone');
      table.text('address');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('medicines', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('generic_name');
      table.text('composition');
      table.string('manufacturer');
      table.string('category');
      table.string('barcode');
      table.string('hsn_code');
      table.decimal('gst_rate', 5, 2).defaultTo(0.00);
      table.decimal('purchase_price', 12, 2).defaultTo(0.00);
      table.decimal('selling_price', 12, 2).defaultTo(0.00);
      table.decimal('mrp', 12, 2).defaultTo(0.00);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('inventory', table => {
      table.increments('id').primary();
      table.integer('medicine_id').unsigned().notNullable()
        .references('id').inTable('medicines').onDelete('CASCADE');
      table.integer('current_stock').defaultTo(0);
      table.integer('reserved_stock').defaultTo(0);
      table.integer('minimum_stock').defaultTo(0);
      table.integer('reorder_level').defaultTo(0);
      table.timestamps(true, true);
    })
    .createTable('batches', table => {
      table.increments('id').primary();
      table.integer('medicine_id').unsigned().notNullable()
        .references('id').inTable('medicines').onDelete('CASCADE');
      table.string('batch_number').notNullable();
      table.date('manufacturing_date');
      table.date('expiry_date');
      table.integer('quantity').defaultTo(0);
      table.decimal('purchase_rate', 12, 2).defaultTo(0.00);
      table.decimal('mrp', 12, 2).defaultTo(0.00);
      table.decimal('selling_price', 12, 2).defaultTo(0.00);
      table.timestamps(true, true);
    })
    .createTable('purchases', table => {
      table.increments('id').primary();
      table.integer('supplier_id').unsigned()
        .references('id').inTable('suppliers').onDelete('SET NULL');
      table.string('invoice_number').notNullable();
      table.date('invoice_date');
      table.decimal('subtotal', 12, 2).defaultTo(0.00);
      table.decimal('gst_amount', 12, 2).defaultTo(0.00);
      table.decimal('total_amount', 12, 2).defaultTo(0.00);
      table.string('status').defaultTo('Completed'); // Completed, Returned
      table.integer('created_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
    })
    .createTable('purchase_items', table => {
      table.increments('id').primary();
      table.integer('purchase_id').unsigned().notNullable()
        .references('id').inTable('purchases').onDelete('CASCADE');
      table.integer('medicine_id').unsigned().notNullable()
        .references('id').inTable('medicines').onDelete('CASCADE');
      table.integer('batch_id').unsigned()
        .references('id').inTable('batches').onDelete('SET NULL');
      table.integer('quantity').defaultTo(0);
      table.decimal('purchase_rate', 12, 2).defaultTo(0.00);
      table.decimal('gst_rate', 5, 2).defaultTo(0.00);
      table.decimal('total', 12, 2).defaultTo(0.00);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('customers', table => {
      table.increments('id').primary();
      table.string('customer_name').notNullable();
      table.string('mobile');
      table.string('email');
      table.text('address');
      table.integer('loyalty_points').defaultTo(0);
      table.decimal('credit_balance', 12, 2).defaultTo(0.00);
      table.timestamps(true, true);
    })
    .createTable('sales', table => {
      table.increments('id').primary();
      table.string('invoice_number').notNullable().unique();
      table.integer('customer_id').unsigned()
        .references('id').inTable('customers').onDelete('SET NULL');
      table.decimal('subtotal', 12, 2).defaultTo(0.00);
      table.decimal('gst_amount', 12, 2).defaultTo(0.00);
      table.decimal('discount_amount', 12, 2).defaultTo(0.00);
      table.decimal('total_amount', 12, 2).defaultTo(0.00);
      table.string('payment_method').defaultTo('Cash'); // Cash, Card, UPI, Credit
      table.string('payment_status').defaultTo('Paid'); // Paid, Pending, Refunded
      table.integer('created_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('sale_items', table => {
      table.increments('id').primary();
      table.integer('sale_id').unsigned().notNullable()
        .references('id').inTable('sales').onDelete('CASCADE');
      table.integer('medicine_id').unsigned().notNullable()
        .references('id').inTable('medicines').onDelete('CASCADE');
      table.integer('batch_id').unsigned()
        .references('id').inTable('batches').onDelete('SET NULL');
      table.integer('quantity').defaultTo(0);
      table.decimal('rate', 12, 2).defaultTo(0.00);
      table.decimal('gst_rate', 5, 2).defaultTo(0.00);
      table.decimal('discount', 12, 2).defaultTo(0.00);
      table.decimal('total', 12, 2).defaultTo(0.00);
    })
    .createTable('prescriptions', table => {
      table.increments('id').primary();
      table.integer('customer_id').unsigned()
        .references('id').inTable('customers').onDelete('SET NULL');
      table.string('doctor_name');
      table.string('prescription_file');
      table.text('notes');
      table.string('verification_status').defaultTo('Pending'); // Pending, Verified, Rejected
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('expenses', table => {
      table.increments('id').primary();
      table.string('expense_type').notNullable();
      table.decimal('amount', 12, 2).defaultTo(0.00);
      table.text('notes');
      table.date('expense_date');
      table.integer('created_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
    })
    .createTable('notifications', table => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('message');
      table.string('type').defaultTo('Info'); // LowStock, NearExpiry, PaymentDue, Info
      table.boolean('is_read').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('audit_logs', table => {
      table.increments('id').primary();
      table.integer('user_id').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.string('action').notNullable();
      table.string('module');
      table.text('details');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('audit_logs')
    .dropTableIfExists('notifications')
    .dropTableIfExists('expenses')
    .dropTableIfExists('prescriptions')
    .dropTableIfExists('sale_items')
    .dropTableIfExists('sales')
    .dropTableIfExists('customers')
    .dropTableIfExists('purchase_items')
    .dropTableIfExists('purchases')
    .dropTableIfExists('batches')
    .dropTableIfExists('inventory')
    .dropTableIfExists('medicines')
    .dropTableIfExists('suppliers');
};
