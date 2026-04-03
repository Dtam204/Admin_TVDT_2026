const { pool } = require('./src/config/database');
const borrowService = require('./src/services/admin/borrow.service');

async function testBorrow() {
  console.log('📚 Testing Borrow Registration (Fixed 400)...');
  
  try {
    // 1. Get a member and a copy
    const { rows: members } = await pool.query('SELECT id FROM members LIMIT 1');
    const { rows: copies } = await pool.query('SELECT id, barcode FROM publication_copies WHERE status = \'available\' OR status = \'tại kho\' LIMIT 1');
    
    if (members.length === 0 || copies.length === 0) {
      console.log('⚠️ Skip test: Need at least 1 member and 1 available copy.');
      process.exit(0);
    }
    
    const testData = {
      readerId: members[0].id,
      copyId: copies[0].id,
      barcode: copies[0].barcode,
      notes: 'Test borrow registration after fix',
      directBorrow: false // This was failing due to NULL constraints on loan_date/due_date
    };
    
    console.log('📤 Sending data:', testData);
    const result = await borrowService.registerBorrow(testData);
    console.log('✅ Success! Created Loan ID:', result.id);
    
    // Cleanup
    await pool.query('DELETE FROM book_loans WHERE id = $1', [result.id]);
    console.log('🧹 Cleaned up test loan.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

testBorrow();
