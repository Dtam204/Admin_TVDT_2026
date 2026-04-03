require('dotenv').config();
const { Pool } = require('pg');

async function checkSync() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  });

  try {
    console.log('--- FINAL AUDIT FOR 100% SYNCHRONIZATION ---');
    
    const tablesToCheck = [
      'authors', 'collections', 'membership_requests', 'media_folders', 'media_files', 
      'notifications', 'book_reviews', 'wishlists', 'comments', 'comment_reports',
      'user_favorites', 'user_reading_progress', 'interaction_logs'
    ];

    const { rows: tableRows } = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = ANY($1)
    `, [tablesToCheck]);

    const existingTables = tableRows.map(r => r.table_name);
    const missingTables = tablesToCheck.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      console.log('✓ ALL Tables Restored');
    } else {
      console.log('❌ Missing Tables:', missingTables.join(', '));
    }

    // Check key columns
    const columnsToCheck = [
      { table: 'books', column: 'cooperation_status' },
      { table: 'members', column: 'last_activity_at' },
      { table: 'members', column: 'points' },
      { table: 'publication_copies', column: 'storage_location' }
    ];

    for (const item of columnsToCheck) {
      const { rows: colRows } = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [item.table, item.column]);
      
      if (colRows.length > 0) {
        console.log(`✓ Column ${item.table}.${item.column} Synced`);
      } else {
        console.log(`❌ Column ${item.table}.${item.column} MISSING`);
      }
    }

    console.log('--- AUDIT COMPLETED ---');

  } catch (err) {
    console.error('Audit Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkSync();
