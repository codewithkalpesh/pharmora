const knex = require('knex');
const knexConfig = require('../knexfile');

// Singleton database connection — shared across all controllers
const db = knex(knexConfig.development);

module.exports = db;
