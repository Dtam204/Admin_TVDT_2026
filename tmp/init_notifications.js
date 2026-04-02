const { pool } = require('../backend/src/config/database');

const migrate = async () => {
    try {
        console.log('--- Migrating Notifications Table ---');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                title JSONB NOT NULL,
                body JSONB NOT NULL,
                target_type VARCHAR(50) DEFAULT 'all',
                target_id INTEGER,
                sender_id INTEGER REFERENCES users(id),
                status VARCHAR(20) DEFAULT 'sent',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('--- Migration Failed ---', error.message);
        process.exit(1);
    }
};

migrate();
