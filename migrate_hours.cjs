const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('Running migration: add horario_fechamento to restaurantes...');
        await pool.query('ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS horario_fechamento TIME;');
        await pool.query('ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS horario_eventos TEXT;');

        // Update the Demo Restaurant to close at 23:30 by default 
        await pool.query('UPDATE restaurantes SET horario_fechamento = \'23:30:00\' WHERE id_restaurante = 1;');

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
