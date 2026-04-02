const { pool } = require('./src/config/database');

async function checkAuthorsTable() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'authors'
    `);
    console.log('Authors Table Columns:');
    console.table(res.rows);
    
    const records = await pool.query('SELECT * FROM authors LIMIT 1');
    console.log('Sample Record:', JSON.stringify(records.rows[0], null, 2));

    const bookCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'books' 
      WHERE column_name = 'author'
    `);
    console.log('Books.author column:', bookCols.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkAuthorsTable();
