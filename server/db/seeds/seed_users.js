const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Inserts seed entries
  await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@pharmacy.com',
      password: hashedPassword,
      role: 'Admin',
      is_active: true
    }
  ]);
};
