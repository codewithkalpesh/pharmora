exports.up = function(knex) {
  return knex.schema.alterTable('medicines', table => {
    table.integer('pack_size').defaultTo(1); // Number of tablets/units per strip/pack
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('medicines', table => {
    table.dropColumn('pack_size');
  });
};
