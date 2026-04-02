const { pool } = require('./backend/src/config/database');

async function migrate() {
    try {
        console.log("Starting migration...");
        await pool.query(`
            ALTER TABLE membership_plans 
            ADD COLUMN IF NOT EXISTS tier_code VARCHAR(50) DEFAULT 'basic';
        `);
        console.log("Added tier_code to membership_plans.");

        const { rows } = await pool.query(`SELECT id, tier_code FROM membership_plans LIMIT 5`);
        console.log("Current plans:", rows);

        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
