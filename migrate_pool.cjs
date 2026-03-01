const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('Running migration...');
        // 1. Alter pagamentos_divisoes to allow null id_usuario_pagador
        await pool.query('ALTER TABLE pagamentos_divisoes ALTER COLUMN id_usuario_pagador DROP NOT NULL;');

        // 2. Add nome_contribuinte
        await pool.query('ALTER TABLE pagamentos_divisoes ADD COLUMN IF NOT EXISTS nome_contribuinte VARCHAR(100);');

        // 3. Add stripe_payment_intent_id
        await pool.query('ALTER TABLE pagamentos_divisoes ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(100);');

        // 4. Add criado_em
        await pool.query('ALTER TABLE pagamentos_divisoes ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
