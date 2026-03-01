const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    try {
        console.log('Running seed...');
        // Insert Restaurant 1
        const res = await pool.query("INSERT INTO restaurantes (nome_fantasia) VALUES ('Restaurante Demo') ON CONFLICT DO NOTHING RETURNING id_restaurante;");
        let restId = 1;

        // Insert some Tables (Mesas)
        await pool.query("INSERT INTO mesas (id_restaurante, identificador_mesa, capacidade) VALUES ($1, 'MESA-01', 4) ON CONFLICT DO NOTHING", [restId]);
        await pool.query("INSERT INTO mesas (id_restaurante, identificador_mesa, capacidade) VALUES ($1, 'MESA-02', 2) ON CONFLICT DO NOTHING", [restId]);
        await pool.query("INSERT INTO mesas (id_restaurante, identificador_mesa, capacidade) VALUES ($1, 'MESA-03', 6) ON CONFLICT DO NOTHING", [restId]);

        // Insert User 4 (as placeholder if not exists)
        await pool.query("INSERT INTO usuarios (id_usuario, nome_completo, email, telefone, senha_hash) VALUES (4, 'Cliente Anonimo', 'anon@mesa.com', '000', '123') ON CONFLICT DO NOTHING;");

        console.log('Seed completed successfully.');
    } catch (err) {
        console.error('Seed failed:', err);
    } finally {
        await pool.end();
    }
}

seed();
