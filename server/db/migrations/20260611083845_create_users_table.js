exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('username').unique().notNullable();
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.enum('role', ['Admin', 'Pharmacist', 'Cashier', 'Manager']).defaultTo('Cashier');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
