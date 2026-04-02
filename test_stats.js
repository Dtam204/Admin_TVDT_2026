const fetch = require('node-fetch');

async function testStats() {
  try {
    // Note: We need a token, but let's see if we can at least reach it 
    // or if we get a 401 (meaning route exists) vs 404 (meaning route not found/intercepted)
    const response = await fetch('http://localhost:5000/api/admin/members/stats');
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testStats();
