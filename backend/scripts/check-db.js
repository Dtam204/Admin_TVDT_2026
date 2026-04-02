const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME
});

async function checkTable() {
  let output = '';
  try {
    output += '--- Checking news table ---\n';
    const newsRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'news'
      ORDER BY ordinal_position;
    `);
    output += 'NEWS COLUMNS:\n';
    newsRes.rows.forEach(row => output += `- ${row.column_name} (${row.data_type})\n`);

    output += '\n--- Checking homepage_sections table ---\n';
    const homeRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'homepage_sections'
      ORDER BY ordinal_position;
    `);
    output += 'HOMEPAGE_SECTIONS COLUMNS:\n';
    homeRes.rows.forEach(row => output += `- ${row.column_name} (${row.data_type})\n`);

    fs.writeFileSync(path.join(__dirname, 'db-check-output.txt'), output, 'utf8');
    console.log('Results written to scripts/db-check-output.txt');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTable();
