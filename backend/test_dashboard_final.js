const { pool } = require('./src/config/database');
const DashboardService = require('./src/services/admin/dashboard.service');

async function testDashboard() {
  console.log('📊 Testing Dashboard Summary...');
  try {
    const summary = await DashboardService.getSummary();
    console.log('✅ Dashboard Data:', JSON.stringify(summary, null, 2));
    
    console.log('📝 Testing Recent Activities...');
    const activities = await DashboardService.getRecentActivities();
    console.log('✅ Activities Data:', JSON.stringify(activities, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

testDashboard();
