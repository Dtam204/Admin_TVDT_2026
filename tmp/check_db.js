const { pool } = require('../backend/src/config/database');
require('dotenv').config({ path: '../backend/.env' });

async function check() {
  try {
    const res = await pool.query("SELECT id, email, full_name, membership_expires, wallet_balance FROM members WHERE id = 10");
    console.log('MEMBER DATA:', res.rows[0]);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
