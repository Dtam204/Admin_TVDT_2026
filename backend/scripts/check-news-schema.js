require('dotenv').config({ path: 'backend/.env' });
const { pool } = require('../src/config/database');

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'news'
      ORDER BY ordinal_position;
    `);
    console.log('--- News Table Schema ---');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
