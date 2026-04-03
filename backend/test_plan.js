const { pool } = require('./src/config/database');

async function testCreatePlan() {
  console.log('🧪 Testing Membership Plan Creation...');
  const testData = {
    name: JSON.stringify({ vi: 'Gói Thử Nghiệm 2026', en: 'Test Plan 2026' }),
    slug: 'test-plan-' + Date.now(),
    price: 99000,
    duration_days: 30,
    max_renewal_limit: 5,
    allow_digital_read: true,
    allow_download: false,
    status: 'active'
  };

  const fields = Object.keys(testData).join(', ');
  const placeholders = Object.keys(testData).map((_, i) => `$${i + 1}`).join(', ');
  const values = Object.values(testData);

  try {
    const { rows } = await pool.query(
      `INSERT INTO membership_plans (${fields}) VALUES (${placeholders}) RETURNING id`,
      values
    );
    console.log('✅ Success! Created Plan ID:', rows[0].id);
    
    // Cleanup
    await pool.query('DELETE FROM membership_plans WHERE id = $1', [rows[0].id]);
    console.log('🧹 Cleaned up test data.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

testCreatePlan();
