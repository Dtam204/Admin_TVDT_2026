const PublicationService = require('./backend/src/services/admin/publication.service');

async function testGetAll() {
  try {
    console.log('--- TEST getAll (No params) ---');
    const results = await PublicationService.getAll({});
    console.log('Results length:', results.length);
    if (results.length > 0) {
      console.log('First item:', results[0]);
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testGetAll();
