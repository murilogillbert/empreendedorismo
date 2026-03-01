/**
 * run_schema.cjs - Executa schema no Neon
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
});

async function run() {
    const client = await pool.connect();
    console.log('Conectado ao Neon!');

    const steps = [
        // Drop tables
        `DROP TABLE IF EXISTS funcionarios_restaurante CASCADE`,
        `DROP TABLE IF EXISTS taxas_transacao CASCADE`,
        `DROP TABLE IF EXISTS pagamentos_formas CASCADE`,
        `DROP TABLE IF EXISTS pagamentos_divisoes CASCADE`,
        `DROP TABLE IF EXISTS pool_itens CASCADE`,
        `DROP TABLE IF EXISTS pagamentos CASCADE`,
        `DROP TABLE IF EXISTS cozinha_filas CASCADE`,
        `DROP TABLE IF EXISTS pedidos_itens_adicionais CASCADE`,
        `DROP TABLE IF EXISTS pedidos_itens CASCADE`,
        `DROP TABLE IF EXISTS pedidos CASCADE`,
        `DROP TABLE IF EXISTS cardapio_itens_adicionais CASCADE`,
        `DROP TABLE IF EXISTS cardapio_itens_ingredientes CASCADE`,
        `DROP TABLE IF EXISTS cardapio_itens_alergenos CASCADE`,
        `DROP TABLE IF EXISTS cardapio_itens CASCADE`,
        `DROP TABLE IF EXISTS alergenos CASCADE`,
        `DROP TABLE IF EXISTS sessoes CASCADE`,
        `DROP TABLE IF EXISTS mesas CASCADE`,
        `DROP TABLE IF EXISTS restaurantes_config_pagamento CASCADE`,
        `DROP TABLE IF EXISTS restaurantes CASCADE`,
        `DROP TABLE IF EXISTS usuarios_papeis CASCADE`,
        `DROP TABLE IF EXISTS papeis CASCADE`,
        `DROP TABLE IF EXISTS usuarios CASCADE`,

        // Create tables
        `CREATE TABLE usuarios (
            id_usuario SERIAL PRIMARY KEY,
            nome_completo VARCHAR(150) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            telefone VARCHAR(20) NOT NULL,
            senha_hash VARCHAR(255) NOT NULL,
            criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP NULL DEFAULT NULL,
            ativo BOOLEAN NOT NULL DEFAULT true
        )`,
        `CREATE TABLE papeis (
            id_papel SERIAL PRIMARY KEY,
            nome VARCHAR(50) NOT NULL UNIQUE,
            descricao VARCHAR(255) NULL
        )`,
        `INSERT INTO papeis (nome, descricao) VALUES
            ('ADMIN', 'Administrador do Restaurante'),
            ('COZINHA', 'Funcionário da Cozinha'),
            ('CLIENTE', 'Cliente do Aplicativo')`,
        `CREATE TABLE usuarios_papeis (
            id_usuario_papel SERIAL PRIMARY KEY,
            id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
            id_papel INTEGER NOT NULL REFERENCES papeis(id_papel) ON DELETE CASCADE,
            id_restaurante INTEGER NULL
        )`,
        `CREATE TABLE restaurantes (
            id_restaurante SERIAL PRIMARY KEY,
            nome_fantasia VARCHAR(150) NOT NULL,
            cnpj VARCHAR(20) NULL UNIQUE,
            logradouro VARCHAR(200) NULL,
            cidade VARCHAR(100) NULL,
            estado VARCHAR(2) NULL,
            horario_fechamento TIME NULL,
            ativo BOOLEAN NOT NULL DEFAULT true
        )`,
        `CREATE TABLE restaurantes_config_pagamento (
            id_restaurante INTEGER PRIMARY KEY REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
            taxa_servico_percentual DECIMAL(5,2) DEFAULT 10.00,
            taxa_plataforma_percentual DECIMAL(5,2) DEFAULT 1.00
        )`,
        `CREATE TABLE mesas (
            id_mesa SERIAL PRIMARY KEY,
            id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
            identificador_mesa VARCHAR(20) NOT NULL,
            capacidade INTEGER DEFAULT 4,
            ativa BOOLEAN NOT NULL DEFAULT true
        )`,
        `CREATE TABLE sessoes (
            id_sessao SERIAL PRIMARY KEY,
            id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
            id_mesa INTEGER REFERENCES mesas(id_mesa) ON DELETE SET NULL,
            id_usuario_criador INTEGER NOT NULL REFERENCES usuarios(id_usuario),
            status VARCHAR(20) DEFAULT 'ABERTA',
            criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE alergenos (
            id_alergeno SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL UNIQUE
        )`,
        `INSERT INTO alergenos (nome) VALUES
            ('Glúten'), ('Lactose'), ('Amendoim'), ('Ovos'), ('Peixes'), ('Soja'), ('Nozes')`,
        `CREATE TABLE cardapio_itens (
            id_item SERIAL PRIMARY KEY,
            id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
            nome VARCHAR(150) NOT NULL,
            descricao TEXT NULL,
            image_url TEXT NULL,
            preco DECIMAL(10,2) NOT NULL,
            categoria VARCHAR(50) NOT NULL,
            ativo BOOLEAN NOT NULL DEFAULT true
        )`,
        `CREATE TABLE cardapio_itens_alergenos (
            id_item INTEGER NOT NULL REFERENCES cardapio_itens(id_item) ON DELETE CASCADE,
            id_alergeno INTEGER NOT NULL REFERENCES alergenos(id_alergeno) ON DELETE CASCADE,
            PRIMARY KEY (id_item, id_alergeno)
        )`,
        `CREATE TABLE cardapio_itens_ingredientes (
            id_item_ingrediente SERIAL PRIMARY KEY,
            id_item INTEGER NOT NULL REFERENCES cardapio_itens(id_item) ON DELETE CASCADE,
            nome VARCHAR(100) NOT NULL
        )`,
        `CREATE TABLE cardapio_itens_adicionais (
            id_item_adicional SERIAL PRIMARY KEY,
            id_item INTEGER NOT NULL REFERENCES cardapio_itens(id_item) ON DELETE CASCADE,
            nome VARCHAR(100) NOT NULL,
            preco DECIMAL(10,2) NOT NULL DEFAULT 0.00
        )`,
        `CREATE TABLE pedidos (
            id_pedido SERIAL PRIMARY KEY,
            id_sessao INTEGER NOT NULL REFERENCES sessoes(id_sessao) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'Recebido',
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            em_preparo_em TIMESTAMP NULL,
            pronto_em TIMESTAMP NULL,
            entregue_em TIMESTAMP NULL
        )`,
        `CREATE TABLE pedidos_itens (
            id_pedido_item SERIAL PRIMARY KEY,
            id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
            id_item INTEGER NOT NULL REFERENCES cardapio_itens(id_item),
            quantidade INTEGER NOT NULL DEFAULT 1,
            valor_unitario_base DECIMAL(10,2) NOT NULL,
            final_price DECIMAL(10,2) NOT NULL,
            observacoes TEXT NULL
        )`,
        `CREATE TABLE pedidos_itens_adicionais (
            id_pedido_item_adicional SERIAL PRIMARY KEY,
            id_pedido_item INTEGER NOT NULL REFERENCES pedidos_itens(id_pedido_item) ON DELETE CASCADE,
            id_item_adicional INTEGER NOT NULL REFERENCES cardapio_itens_adicionais(id_item_adicional),
            nome_snapshot VARCHAR(100) NOT NULL,
            preco_snapshot DECIMAL(10,2) NOT NULL
        )`,
        `CREATE TABLE cozinha_filas (
            id_fila SERIAL PRIMARY KEY,
            id_pedido_item INTEGER NOT NULL REFERENCES pedidos_itens(id_pedido_item) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'AGUARDANDO',
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE pagamentos (
            id_pagamento SERIAL PRIMARY KEY,
            id_sessao INTEGER NOT NULL REFERENCES sessoes(id_sessao) ON DELETE CASCADE,
            valor_total DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) NOT NULL,
            metodo VARCHAR(20) NOT NULL,
            stripe_payment_id VARCHAR(100) NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE pagamentos_divisoes (
            id_divisao SERIAL PRIMARY KEY,
            id_pagamento INTEGER NOT NULL REFERENCES pagamentos(id_pagamento) ON DELETE CASCADE,
            id_usuario_pagador INTEGER REFERENCES usuarios(id_usuario),
            nome_contribuinte VARCHAR(100),
            stripe_payment_intent_id VARCHAR(100),
            valor DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) DEFAULT 'PENDENTE',
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE pagamentos_formas (
            id_pagamento_forma SERIAL PRIMARY KEY,
            id_pagamento INTEGER NOT NULL REFERENCES pagamentos(id_pagamento) ON DELETE CASCADE,
            tipo VARCHAR(20) NOT NULL,
            valor DECIMAL(10,2) NOT NULL
        )`,
        `CREATE TABLE taxas_transacao (
            id_taxa SERIAL PRIMARY KEY,
            id_pagamento INTEGER NOT NULL REFERENCES pagamentos(id_pagamento) ON DELETE CASCADE,
            valor_api_gateway DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            valor_plataforma DECIMAL(10,2) NOT NULL DEFAULT 0.00
        )`,
        `CREATE TABLE pool_itens (
            id_pool_item SERIAL PRIMARY KEY,
            id_pagamento INTEGER NOT NULL REFERENCES pagamentos(id_pagamento) ON DELETE CASCADE,
            id_pedido_item INTEGER NOT NULL REFERENCES pedidos_itens(id_pedido_item) ON DELETE CASCADE,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(id_pedido_item)
        )`,
        `CREATE TABLE funcionarios_restaurante (
            id_funcionario SERIAL PRIMARY KEY,
            id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
            id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
            funcao VARCHAR(20) NOT NULL,
            ativo BOOLEAN DEFAULT true
        )`,
        `CREATE OR REPLACE FUNCTION atualizar_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.atualizado_em = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql`,
        `CREATE TRIGGER trg_cozinha_atualizado
        BEFORE UPDATE ON cozinha_filas
        FOR EACH ROW
        EXECUTE FUNCTION atualizar_timestamp()`,
    ];

    try {
        for (let i = 0; i < steps.length; i++) {
            await client.query(steps[i]);
            process.stdout.write('.');
        }
        console.log('\nSchema criado com sucesso!');
    } catch (err) {
        console.error('\nErro no schema:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
