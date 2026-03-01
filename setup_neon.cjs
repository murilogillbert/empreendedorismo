/**
 * setup_neon.cjs
 * Cria toda a estrutura do banco de dados no Neon e insere dados iniciais.
 * Execute com: node setup_neon.cjs
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  connectionTimeoutMillis: 15000,
});

const SCHEMA_SQL = `
-- =====================================================
-- Script SQL - Sistema de Gestão de Restaurantes
-- =====================================================

DROP TABLE IF EXISTS funcionarios_restaurante CASCADE;
DROP TABLE IF EXISTS taxas_transacao CASCADE;
DROP TABLE IF EXISTS pagamentos_formas CASCADE;
DROP TABLE IF EXISTS pagamentos_divisoes CASCADE;
DROP TABLE IF EXISTS pool_itens CASCADE;
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS cozinha_filas CASCADE;
DROP TABLE IF EXISTS pedidos_itens_adicionais CASCADE;
DROP TABLE IF EXISTS pedidos_itens CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS cardapio_itens_adicionais CASCADE;
DROP TABLE IF EXISTS cardapio_itens_ingredientes CASCADE;
DROP TABLE IF EXISTS cardapio_itens_alergenos CASCADE;
DROP TABLE IF EXISTS cardapio_itens CASCADE;
DROP TABLE IF EXISTS alergenos CASCADE;
DROP TABLE IF EXISTS sessoes CASCADE;
DROP TABLE IF EXISTS mesas CASCADE;
DROP TABLE IF EXISTS restaurantes_config_pagamento CASCADE;
DROP TABLE IF EXISTS restaurantes CASCADE;
DROP TABLE IF EXISTS usuarios_papeis CASCADE;
DROP TABLE IF EXISTS papeis CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nome_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NULL DEFAULT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE papeis (
    id_papel SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255) NULL
);

INSERT INTO papeis (nome, descricao) VALUES
('ADMIN', 'Administrador do Restaurante'),
('COZINHA', 'Funcionário da Cozinha'),
('CLIENTE', 'Cliente do Aplicativo');

CREATE TABLE usuarios_papeis (
    id_usuario_papel SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_papel INTEGER NOT NULL REFERENCES papeis(id_papel) ON DELETE CASCADE,
    id_restaurante INTEGER NULL
);

CREATE TABLE restaurantes (
    id_restaurante SERIAL PRIMARY KEY,
    nome_fantasia VARCHAR(150) NOT NULL,
    cnpj VARCHAR(20) NULL UNIQUE,
    logradouro VARCHAR(200) NULL,
    cidade VARCHAR(100) NULL,
    estado VARCHAR(2) NULL,
    latitude VARCHAR(50) NULL,
    longitude VARCHAR(50) NULL,
    slug VARCHAR(100) NULL UNIQUE,
    horario_fechamento TIME NULL,
    ativo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE restaurantes_config_pagamento (
    id_restaurante INTEGER PRIMARY KEY REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    taxa_servico_percentual DECIMAL(5,2) DEFAULT 10.00,
    taxa_plataforma_percentual DECIMAL(5,2) DEFAULT 1.00
);

CREATE TABLE mesas (
    id_mesa SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    identificador_mesa VARCHAR(20) NOT NULL,
    capacidade INTEGER DEFAULT 4,
    ativa BOOLEAN NOT NULL DEFAULT true,
    chamar_garcom BOOLEAN DEFAULT false,
    chamar_garcom_em TIMESTAMP NULL
);

CREATE TABLE sessoes (
    id_sessao SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    id_mesa INTEGER REFERENCES mesas(id_mesa) ON DELETE SET NULL,
    id_usuario_criador INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    status VARCHAR(20) DEFAULT 'ABERTA',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alergenos (
    id_alergeno SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO alergenos (nome) VALUES
('Glúten'), ('Lactose'), ('Amendoim'), ('Ovos'), ('Peixes'), ('Soja'), ('Nozes');

CREATE TABLE cardapio_itens (
    id_item SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    image_url TEXT NULL,
    preco DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE cardapio_itens_alergenos (
    id_item INTEGER NOT NULL REFERENCES cardapio_itens(id_item) ON DELETE CASCADE,
    id_alergeno INTEGER NOT NULL REFERENCES alergenos(id_alergeno) ON DELETE CASCADE,
    PRIMARY KEY (id_item, id_alergeno)
);

CREATE TABLE cardapio_itens_ingredientes (
    id_item_ingrediente SERIAL PRIMARY KEY,
    id_item INTEGER NOT NULL REFERENCES cardapio_itens(id_item) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE cardapio_itens_adicionais (
    id_item_adicional SERIAL PRIMARY KEY,
    id_item INTEGER NOT NULL REFERENCES cardapio_itens(id_item) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_sessao INTEGER NOT NULL REFERENCES sessoes(id_sessao) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Recebido',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    em_preparo_em TIMESTAMP NULL,
    pronto_em TIMESTAMP NULL,
    entregue_em TIMESTAMP NULL
);

CREATE TABLE pedidos_itens (
    id_pedido_item SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_item INTEGER NOT NULL REFERENCES cardapio_itens(id_item),
    quantidade INTEGER NOT NULL DEFAULT 1,
    valor_unitario_base DECIMAL(10,2) NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    observacoes TEXT NULL
);

CREATE TABLE pedidos_itens_adicionais (
    id_pedido_item_adicional SERIAL PRIMARY KEY,
    id_pedido_item INTEGER NOT NULL REFERENCES pedidos_itens(id_pedido_item) ON DELETE CASCADE,
    id_item_adicional INTEGER NOT NULL REFERENCES cardapio_itens_adicionais(id_item_adicional),
    nome_snapshot VARCHAR(100) NOT NULL,
    preco_snapshot DECIMAL(10,2) NOT NULL
);

CREATE TABLE cozinha_filas (
    id_fila SERIAL PRIMARY KEY,
    id_pedido_item INTEGER NOT NULL REFERENCES pedidos_itens(id_pedido_item) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'AGUARDANDO',
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pagamentos (
    id_pagamento SERIAL PRIMARY KEY,
    id_sessao INTEGER NOT NULL REFERENCES sessoes(id_sessao) ON DELETE CASCADE,
    valor_total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    metodo VARCHAR(20) NOT NULL,
    stripe_payment_id VARCHAR(100) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pagamentos_divisoes (
    id_divisao SERIAL PRIMARY KEY,
    id_pagamento INTEGER NOT NULL REFERENCES pagamentos(id_pagamento) ON DELETE CASCADE,
    id_usuario_pagador INTEGER REFERENCES usuarios(id_usuario),
    nome_contribuinte VARCHAR(100),
    stripe_payment_intent_id VARCHAR(100),
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pagamentos_formas (
    id_pagamento_forma SERIAL PRIMARY KEY,
    id_pagamento INTEGER NOT NULL REFERENCES pagamentos(id_pagamento) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL
);

CREATE TABLE taxas_transacao (
    id_taxa SERIAL PRIMARY KEY,
    id_pagamento INTEGER NOT NULL REFERENCES pagamentos(id_pagamento) ON DELETE CASCADE,
    valor_api_gateway DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valor_plataforma DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE pool_itens (
    id_pool_item SERIAL PRIMARY KEY,
    id_pagamento INTEGER NOT NULL REFERENCES pagamentos(id_pagamento) ON DELETE CASCADE,
    id_pedido_item INTEGER NOT NULL REFERENCES pedidos_itens(id_pedido_item) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_pedido_item)
);

CREATE TABLE funcionarios_restaurante (
    id_funcionario SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    funcao VARCHAR(20) NOT NULL,
    ativo BOOLEAN DEFAULT true
);

CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cozinha_atualizado
BEFORE UPDATE ON cozinha_filas
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();
`;

const SEED_SQL = `
-- Restaurante principal
INSERT INTO restaurantes (id_restaurante, nome_fantasia, cnpj, logradouro, cidade, estado, latitude, longitude, slug, horario_fechamento)
VALUES (1, 'Vite Gourmet Burger', '12.345.678/0001-90', 'Av. Paulista, 1000', 'São Paulo', 'SP', '-15.608240785072658', '-56.06942710159583', 'vite-gourmet', '23:00:00')
ON CONFLICT (id_restaurante) DO NOTHING;

-- Reinicia a sequência para garantir que o id correto seja usado
SELECT setval('restaurantes_id_restaurante_seq', (SELECT MAX(id_restaurante) FROM restaurantes));

-- Configuração de pagamento
INSERT INTO restaurantes_config_pagamento (id_restaurante, taxa_servico_percentual, taxa_plataforma_percentual)
VALUES (1, 10.00, 1.00)
ON CONFLICT (id_restaurante) DO NOTHING;

-- Mesas
INSERT INTO mesas (id_restaurante, identificador_mesa, capacidade) VALUES
(1, 'MESA 01', 2),
(1, 'MESA 02', 2),
(1, 'MESA 03', 4),
(1, 'MESA 04', 4),
(1, 'MESA 05', 6),
(1, 'VIP 01', 8)
ON CONFLICT DO NOTHING;

-- Usuário anônimo placeholder (id=1 para garantir referência nas sessões)
INSERT INTO usuarios (id_usuario, nome_completo, email, telefone, senha_hash)
VALUES (1, 'Cliente Anônimo', 'anonimo@placeholder.com', '00000000000', 'PLACEHOLDER_HASH')
ON CONFLICT (id_usuario) DO NOTHING;

-- Reinicia a sequência para garantir que o id correto seja usado
SELECT setval('usuarios_id_usuario_seq', (SELECT MAX(id_usuario) FROM usuarios));

-- Cardápio
INSERT INTO cardapio_itens (id_restaurante, nome, descricao, image_url, preco, categoria) VALUES
(1, 'Smash Bacon Supreme', 'Dois blends de 80g, cheddar, bacon caramelizado e maionese defumada.', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', 34.90, 'Hambúrgueres'),
(1, 'Double Cheese Monster', 'Três blends, triplo cheddar, cebola roxa e picles de jalapeño.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 42.00, 'Hambúrgueres'),
(1, 'Veggie Delight', 'Hambúrguer de falafel, hummus de beterraba, espinafre e tomate seco.', 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=800', 31.00, 'Hambúrgueres'),
(1, 'Nuggets Artesanais', '6 unidades de frango marinado acompanhados de molho honey mustard.', 'https://images.unsplash.com/photo-1562967914-6cbb242c7dfa?w=800', 22.00, 'Entradas'),
(1, 'Batata com Alecrim', 'Porção individual de batatas rústicas fritas no óleo de algodão.', 'https://images.unsplash.com/photo-1630384066252-1911fa9be2f7?w=800', 16.50, 'Entradas'),
(1, 'Milkshake Nutella', '500ml de sorvete de baunilha batido com Nutella e avelãs.', 'https://images.unsplash.com/photo-1551024601-bec78acc704b?w=800', 26.00, 'Bebidas'),
(1, 'Soda de Maçã Verde', 'Xarope Monin, água com gás e gelo.', 'https://images.unsplash.com/photo-1513558161293-cdaf7659a992?w=800', 14.00, 'Bebidas'),
(1, 'Cerveja Artesanal IPA', 'Garrafa 600ml de IPA local bem encorpada.', 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800', 28.00, 'Bebidas'),
(1, 'Brownie de Chocolate', 'Servido quente com uma bola de sorvete de creme.', 'https://images.unsplash.com/photo-1564936281291-294551497d81?w=800', 21.00, 'Sobremesas')
ON CONFLICT DO NOTHING;

-- Ingredientes
INSERT INTO cardapio_itens_ingredientes (id_item, nome)
SELECT i.id_item, v.nome FROM cardapio_itens i
CROSS JOIN (VALUES
  ('Pão Brioche'), ('Blend 80g x2'), ('Queijo Cheddar'), ('Bacon Caramelizado'), ('Maionese Defumada')
) v(nome)
WHERE i.nome = 'Smash Bacon Supreme' AND NOT EXISTS (
  SELECT 1 FROM cardapio_itens_ingredientes WHERE id_item = i.id_item
);

INSERT INTO cardapio_itens_ingredientes (id_item, nome)
SELECT i.id_item, v.nome FROM cardapio_itens i
CROSS JOIN (VALUES
  ('Pão com Gergelim'), ('Blend 80g x3'), ('Queijo Cheddar x3'), ('Picles de Jalapeño'), ('Cebola Roxa')
) v(nome)
WHERE i.nome = 'Double Cheese Monster' AND NOT EXISTS (
  SELECT 1 FROM cardapio_itens_ingredientes WHERE id_item = i.id_item
);

INSERT INTO cardapio_itens_ingredientes (id_item, nome)
SELECT i.id_item, v.nome FROM cardapio_itens i
CROSS JOIN (VALUES
  ('Bolinho de Falafel'), ('Hummus'), ('Espinafre'), ('Tomate Seco')
) v(nome)
WHERE i.nome = 'Veggie Delight' AND NOT EXISTS (
  SELECT 1 FROM cardapio_itens_ingredientes WHERE id_item = i.id_item
);

INSERT INTO cardapio_itens_ingredientes (id_item, nome)
SELECT i.id_item, v.nome FROM cardapio_itens i
CROSS JOIN (VALUES
  ('Frango'), ('Farinha Panko'), ('Tempero Secreto')
) v(nome)
WHERE i.nome = 'Nuggets Artesanais' AND NOT EXISTS (
  SELECT 1 FROM cardapio_itens_ingredientes WHERE id_item = i.id_item
);

-- Adicionais
INSERT INTO cardapio_itens_adicionais (id_item, nome, preco)
SELECT i.id_item, v.nome, v.preco FROM cardapio_itens i
CROSS JOIN (VALUES
  ('Ovo Estalado', 3.50), ('Carne Extra', 9.00), ('Cheddar Extra', 4.00)
) v(nome, preco)
WHERE i.nome = 'Smash Bacon Supreme' AND NOT EXISTS (
  SELECT 1 FROM cardapio_itens_adicionais WHERE id_item = i.id_item
);

INSERT INTO cardapio_itens_adicionais (id_item, nome, preco)
SELECT i.id_item, v.nome, v.preco FROM cardapio_itens i
CROSS JOIN (VALUES
  ('Picles em Dobro', 2.00), ('Bacon Extra', 5.00)
) v(nome, preco)
WHERE i.nome = 'Double Cheese Monster' AND NOT EXISTS (
  SELECT 1 FROM cardapio_itens_adicionais WHERE id_item = i.id_item
);

INSERT INTO cardapio_itens_adicionais (id_item, nome, preco)
SELECT i.id_item, v.nome, v.preco FROM cardapio_itens i
CROSS JOIN (VALUES ('Tofu Grelhado', 6.50)) v(nome, preco)
WHERE i.nome = 'Veggie Delight' AND NOT EXISTS (
  SELECT 1 FROM cardapio_itens_adicionais WHERE id_item = i.id_item
);

INSERT INTO cardapio_itens_adicionais (id_item, nome, preco)
SELECT i.id_item, v.nome, v.preco FROM cardapio_itens i
CROSS JOIN (VALUES ('Molho de Queijo', 5.00), ('Pó de Páprica', 1.50)) v(nome, preco)
WHERE i.nome = 'Batata com Alecrim' AND NOT EXISTS (
  SELECT 1 FROM cardapio_itens_adicionais WHERE id_item = i.id_item
);

-- Alérgenos nos itens
INSERT INTO cardapio_itens_alergenos (id_item, id_alergeno)
SELECT i.id_item, a.id_alergeno FROM cardapio_itens i, alergenos a
WHERE i.nome = 'Smash Bacon Supreme' AND a.nome IN ('Glúten', 'Lactose')
ON CONFLICT DO NOTHING;

INSERT INTO cardapio_itens_alergenos (id_item, id_alergeno)
SELECT i.id_item, a.id_alergeno FROM cardapio_itens i, alergenos a
WHERE i.nome = 'Double Cheese Monster' AND a.nome IN ('Glúten', 'Lactose')
ON CONFLICT DO NOTHING;

INSERT INTO cardapio_itens_alergenos (id_item, id_alergeno)
SELECT i.id_item, a.id_alergeno FROM cardapio_itens i, alergenos a
WHERE i.nome = 'Nuggets Artesanais' AND a.nome IN ('Glúten', 'Ovos')
ON CONFLICT DO NOTHING;

INSERT INTO cardapio_itens_alergenos (id_item, id_alergeno)
SELECT i.id_item, a.id_alergeno FROM cardapio_itens i, alergenos a
WHERE i.nome = 'Milkshake Nutella' AND a.nome IN ('Lactose', 'Nozes')
ON CONFLICT DO NOTHING;
`;

async function run() {
  const client = await pool.connect();
  console.log('✅ Conectado ao Neon com sucesso!');

  try {
    console.log('\n📋 Criando schema (pode levar alguns segundos)...');
    await client.query(SCHEMA_SQL);
    console.log('✅ Schema criado com sucesso!');

    console.log('\n🌱 Inserindo dados iniciais...');
    await client.query(SEED_SQL);
    console.log('✅ Dados iniciais inseridos com sucesso!');

    // Verificações
    const tablesCount = await client.query("SELECT COUNT(*) FROM mesas");
    const menuCount = await client.query("SELECT COUNT(*) FROM cardapio_itens");
    const papeis = await client.query("SELECT nome FROM papeis");

    console.log('\n📊 Resumo do banco de dados:');
    console.log(`  - Mesas: ${tablesCount.rows[0].count}`);
    console.log(`  - Itens no cardápio: ${menuCount.rows[0].count}`);
    console.log(`  - Papéis: ${papeis.rows.map(r => r.nome).join(', ')}`);
    console.log('\n🎉 Migração concluída! O servidor está pronto para usar o Neon.');

  } catch (err) {
    console.error('\n❌ Erro durante a migração:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
