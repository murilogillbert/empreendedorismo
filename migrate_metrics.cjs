const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('Running migration: add metric timestamps to pedidos...');

        await pool.query(`
            ALTER TABLE pedidos 
            ADD COLUMN IF NOT EXISTS em_preparo_em TIMESTAMP,
            ADD COLUMN IF NOT EXISTS pronto_em TIMESTAMP,
            ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMP;
        `);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
