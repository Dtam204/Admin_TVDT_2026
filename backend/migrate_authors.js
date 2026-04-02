const { pool } = require('./src/config/database');

async function migrateAuthors() {
  const client = await pool.connect();
  try {
    console.log('--- Author Table Migration Start ---');
    
    // Ensure table exists (though it likely does)
    await client.query(`
      CREATE TABLE IF NOT EXISTS authors (
        id SERIAL PRIMARY KEY,
        name JSONB NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        bio JSONB,
        avatar VARCHAR(500),
        birth_year INTEGER,
        nationality VARCHAR(100),
        website VARCHAR(500),
        social_links JSONB,
        total_books INTEGER DEFAULT 0,
        featured BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns if they don't exist (in case of old schema)
    const columnsToAdd = [
      ['bio', 'JSONB'],
      ['avatar', 'VARCHAR(500)'],
      ['birth_year', 'INTEGER'],
      ['nationality', 'VARCHAR(100)'],
      ['website', 'VARCHAR(500)'],
      ['social_links', 'JSONB'],
      ['total_books', 'INTEGER DEFAULT 0'],
      ['featured', 'BOOLEAN DEFAULT false'],
      ['status', "VARCHAR(20) DEFAULT 'active'"]
    ];

    for (const [col, type] of columnsToAdd) {
      await client.query(`
        DO $$ 
        BEGIN 
          BEGIN
            ALTER TABLE authors ADD COLUMN ${col} ${type};
          EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column ${col} already exists in authors.';
          END;
        END $$;
      `);
    }

    console.log('--- Author Table Migration Finished ---');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit();
  }
}

migrateAuthors();
