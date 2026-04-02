const { pool } = require('./src/config/database');
async function check() {
  try {
    const res = await pool.query('SELECT id, name FROM collections LIMIT 5');
    console.log('Collections in DB:', res.rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
