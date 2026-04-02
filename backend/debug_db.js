const { pool } = require('./src/config/database');

async function checkMetadata() {
  try {
    const constraintRes = await pool.query(`
      SELECT pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c 
      JOIN pg_class t ON c.conrelid = t.oid 
      WHERE t.relname = 'payments' AND c.conname = 'payments_type_check'
    `);
    
    console.log('--- CONSTRAINT DEFINITION ---');
    console.log(constraintRes.rows[0]?.def || 'NOT_FOUND');
    
    const typesRes = await pool.query('SELECT DISTINCT type FROM payments');
    console.log('--- CURRENT TYPES IN DB ---');
    console.log(typesRes.rows.map(r => r.type));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkMetadata();
