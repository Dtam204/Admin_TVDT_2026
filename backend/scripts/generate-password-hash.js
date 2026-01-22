/**
 * Script để generate bcrypt hash cho password
 * Sử dụng: node scripts/generate-password-hash.js [password]
 */

const bcrypt = require('bcrypt');

async function generateHash(password = 'admin123') {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('\n✅ Password hash generated successfully!\n');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\n📝 Copy hash above and update it in database/schema.sql\n');
    return hash;
  } catch (error) {
    console.error('❌ Error generating hash:', error.message);
    process.exit(1);
  }
}

const password = process.argv[2] || 'admin123';
generateHash(password);

