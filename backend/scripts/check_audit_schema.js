const { pool } = require('../src/config/database');

async function checkSchema() {
  try {
    console.log('--- Checking audit_logs schema ---');
    const { rows: auditCols } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs'
    `);
    console.log('audit_logs columns:', auditCols);

    console.log('\n--- Checking storage_locations table ---');
    const { rows: tableExists } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'storage_locations'
      )
    `);
    console.log('storage_locations exists:', tableExists[0].exists);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
