const DashboardService = require('../backend/src/services/admin/dashboard.service');
const { pool } = require('../backend/src/config/database');

async function test() {
  try {
    console.log('Testing DashboardService.getSummary()...');
    const summary = await DashboardService.getSummary();
    console.log('Summary Result:', JSON.stringify(summary, null, 2));

    console.log('\nTesting DashboardService.getRecentActivities()...');
    const activities = await DashboardService.getRecentActivities();
    console.log('Activities Result:', JSON.stringify(activities, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error testing DashboardService:', error);
    process.exit(1);
  }
}

test();
