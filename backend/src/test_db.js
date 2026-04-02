const { pool } = require('./config/database');

const fs = require('fs');

async function checkSchema() {
  try {
    const columnsRes = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('payments', 'member_activities')
      ORDER BY table_name, ordinal_position
    `);

    fs.writeFileSync('schema.json', JSON.stringify({
      member_transactions: res2.rows
    }, null, 2));

    process.exit(0);
  } catch (err) {
    fs.writeFileSync('error.txt', err.stack);
    process.exit(1);
  }
}

checkSchema();
