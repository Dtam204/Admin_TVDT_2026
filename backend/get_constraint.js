const { pool } = require('./src/config/database');

async function getConstraint() {
  try {
    const res = await pool.query(`
      SELECT pg_get_constraintdef(c.oid) 
      FROM pg_constraint c 
      JOIN pg_class t ON c.conrelid = t.oid 
      WHERE t.relname = 'payments' AND c.conname = 'payments_type_check'
    `);
    if (res.rows.length > 0) {
      console.log('CONSTRAINT_DEF:', res.rows[0].pg_get_constraintdef);
    } else {
      console.log('CONSTRAINT_NOT_FOUND');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

getConstraint();
