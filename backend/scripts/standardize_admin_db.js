const { pool } = require('../src/config/database');

async function standardize() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Standardizing storage_locations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS storage_locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert some default shelves if empty
    const { rows: existingLocs } = await client.query('SELECT COUNT(*) FROM storage_locations');
    if (parseInt(existingLocs[0].count) === 0) {
      await client.query(`
        INSERT INTO storage_locations (name, description) VALUES 
        ('Kệ A', 'Kệ sách khu vực A'),
        ('Kệ B', 'Kệ sách khu vực B'),
        ('Kệ C', 'Kệ sách khu vực C'),
        ('Kệ D', 'Kệ sách khu vực D'),
        ('Kho lưu trữ', 'Kho lưu trữ chuyên dụng')
      `);
      console.log('   - Added default storage locations.');
    }

    console.log('2. Standardizing audit_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        module VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100),
        description TEXT,
        old_data JSONB,
        new_data JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ensure all columns exist if table was already there
    const columnsToAdd = [
      { name: 'module', type: 'VARCHAR(100)' },
      { name: 'entity_id', type: 'VARCHAR(100)' },
      { name: 'old_data', type: 'JSONB' },
      { name: 'new_data', type: 'JSONB' },
      { name: 'ip_address', type: 'VARCHAR(45)' },
      { name: 'user_agent', type: 'TEXT' }
    ];

    for (const col of columnsToAdd) {
      await client.query(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
    }

    console.log('3. Updating publication_copies to use storage_location_id...');
    await client.query(`
      ALTER TABLE publication_copies 
      ADD COLUMN IF NOT EXISTS storage_location_id INTEGER REFERENCES storage_locations(id) ON DELETE SET NULL
    `);

    // Mapping existing text descriptions to IDs if they match
    await client.query(`
      UPDATE publication_copies pc
      SET storage_location_id = sl.id
      FROM storage_locations sl
      WHERE pc.storage_location_id IS NULL 
      AND (pc.storage_location ILIKE '%' || sl.name || '%')
    `);

    await client.query('COMMIT');
    console.log('✅ Database standardized successfully.');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error standardizing database:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

standardize();
