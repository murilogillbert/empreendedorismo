/**
 * run_seed.cjs - Insere dados iniciais no Neon
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
        // Restaurante
        {
            name: 'Restaurante',
            sql: `INSERT INTO restaurantes (nome_fantasia, cnpj, logradouro, cidade, estado, horario_fechamento)
                  VALUES ('Vite Gourmet Burger', '12.345.678/0001-90', 'Av. Paulista, 1000', 'São Paulo', 'SP', '23:00:00')
                  ON CONFLICT (cnpj) DO NOTHING`
        },
        // Config pagamento
        {
            name: 'Config pagamento',
            sql: `INSERT INTO restaurantes_config_pagamento (id_restaurante, taxa_servico_percentual, taxa_plataforma_percentual)
                  VALUES (1, 10.00, 1.00)
                  ON CONFLICT (id_restaurante) DO NOTHING`
        },
        // Mesas
        {
            name: 'Mesas',
            sql: `INSERT INTO mesas (id_restaurante, identificador_mesa, capacidade) VALUES
                  (1, 'Mesa 01', 2),
                  (1, 'Mesa 02', 2),
                  (1, 'Mesa 03', 4),
                  (1, 'Mesa 04', 4),
                  (1, 'Mesa 05', 6),
                  (1, 'VIP 01', 8)`
        },
        // Usuario placeholder (necessario para sessoes)
        {
            name: 'Usuário placeholder',
            sql: `INSERT INTO usuarios (nome_completo, email, telefone, senha_hash)
                  VALUES ('Cliente Anônimo', 'anonimo@placeholder.com', '00000000000', 'PLACEHOLDER_HASH')
                  ON CONFLICT (email) DO NOTHING`
        },
        // Cardapio
        {
            name: 'Cardápio',
            sql: `INSERT INTO cardapio_itens (id_restaurante, nome, descricao, image_url, preco, categoria) VALUES
                (1, 'Smash Bacon Supreme', 'Dois blends de 80g, cheddar, bacon caramelizado e maionese defumada.', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', 34.90, 'Hambúrgueres'),
                (1, 'Double Cheese Monster', 'Três blends, triplo cheddar, cebola roxa e picles de jalapeño.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 42.00, 'Hambúrgueres'),
                (1, 'Veggie Delight', 'Hambúrguer de falafel, hummus de beterraba, espinafre e tomate seco.', 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=800', 31.00, 'Hambúrgueres'),
                (1, 'Nuggets Artesanais', '6 unidades de frango marinado acompanhados de molho honey mustard.', 'https://images.unsplash.com/photo-1562967914-6cbb242c7dfa?w=800', 22.00, 'Entradas'),
                (1, 'Batata com Alecrim', 'Porção individual de batatas rústicas fritas no óleo de algodão.', 'https://images.unsplash.com/photo-1630384066252-1911fa9be2f7?w=800', 16.50, 'Entradas'),
                (1, 'Milkshake Nutella', '500ml de sorvete de baunilha batido com Nutella e avelãs.', 'https://images.unsplash.com/photo-1551024601-bec78acc704b?w=800', 26.00, 'Bebidas'),
                (1, 'Soda de Maçã Verde', 'Xarope Monin, água com gás e gelo.', 'https://images.unsplash.com/photo-1513558161293-cdaf7659a992?w=800', 14.00, 'Bebidas'),
                (1, 'Cerveja Artesanal IPA', 'Garrafa 600ml de IPA local bem encorpada.', 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800', 28.00, 'Bebidas'),
                (1, 'Brownie de Chocolate', 'Servido quente com uma bola de sorvete de creme.', 'https://images.unsplash.com/photo-1564936281291-294551497d81?w=800', 21.00, 'Sobremesas')`
        },
        // Ingredientes Smash Bacon
        {
            name: 'Ingredientes - Smash Bacon',
            sql: `INSERT INTO cardapio_itens_ingredientes (id_item, nome)
                  SELECT i.id_item, v.nome FROM cardapio_itens i
                  CROSS JOIN (VALUES ('Pão Brioche'), ('Blend 80g x2'), ('Queijo Cheddar'), ('Bacon Caramelizado'), ('Maionese Defumada')) v(nome)
                  WHERE i.nome = 'Smash Bacon Supreme'`
        },
        // Ingredientes Double Cheese
        {
            name: 'Ingredientes - Double Cheese',
            sql: `INSERT INTO cardapio_itens_ingredientes (id_item, nome)
                  SELECT i.id_item, v.nome FROM cardapio_itens i
                  CROSS JOIN (VALUES ('Pão com Gergelim'), ('Blend 80g x3'), ('Queijo Cheddar x3'), ('Picles de Jalapeño'), ('Cebola Roxa')) v(nome)
                  WHERE i.nome = 'Double Cheese Monster'`
        },
        // Ingredientes Veggie
        {
            name: 'Ingredientes - Veggie',
            sql: `INSERT INTO cardapio_itens_ingredientes (id_item, nome)
                  SELECT i.id_item, v.nome FROM cardapio_itens i
                  CROSS JOIN (VALUES ('Bolinho de Falafel'), ('Hummus'), ('Espinafre'), ('Tomate Seco')) v(nome)
                  WHERE i.nome = 'Veggie Delight'`
        },
        // Ingredientes Nuggets
        {
            name: 'Ingredientes - Nuggets',
            sql: `INSERT INTO cardapio_itens_ingredientes (id_item, nome)
                  SELECT i.id_item, v.nome FROM cardapio_itens i
                  CROSS JOIN (VALUES ('Frango'), ('Farinha Panko'), ('Tempero Secreto')) v(nome)
                  WHERE i.nome = 'Nuggets Artesanais'`
        },
        // Adicionais
        {
            name: 'Adicionais - Smash Bacon',
            sql: `INSERT INTO cardapio_itens_adicionais (id_item, nome, preco)
                  SELECT i.id_item, v.nome, v.preco FROM cardapio_itens i
                  CROSS JOIN (VALUES ('Ovo Estalado', 3.50::DECIMAL), ('Carne Extra', 9.00::DECIMAL), ('Cheddar Extra', 4.00::DECIMAL)) v(nome, preco)
                  WHERE i.nome = 'Smash Bacon Supreme'`
        },
        {
            name: 'Adicionais - Double Cheese',
            sql: `INSERT INTO cardapio_itens_adicionais (id_item, nome, preco)
                  SELECT i.id_item, v.nome, v.preco FROM cardapio_itens i
                  CROSS JOIN (VALUES ('Picles em Dobro', 2.00::DECIMAL), ('Bacon Extra', 5.00::DECIMAL)) v(nome, preco)
                  WHERE i.nome = 'Double Cheese Monster'`
        },
        {
            name: 'Adicionais - Veggie',
            sql: `INSERT INTO cardapio_itens_adicionais (id_item, nome, preco)
                  SELECT i.id_item, v.nome, v.preco FROM cardapio_itens i
                  CROSS JOIN (VALUES ('Tofu Grelhado', 6.50::DECIMAL)) v(nome, preco)
                  WHERE i.nome = 'Veggie Delight'`
        },
        {
            name: 'Adicionais - Batata',
            sql: `INSERT INTO cardapio_itens_adicionais (id_item, nome, preco)
                  SELECT i.id_item, v.nome, v.preco FROM cardapio_itens i
                  CROSS JOIN (VALUES ('Molho de Queijo', 5.00::DECIMAL), ('Pó de Páprica', 1.50::DECIMAL)) v(nome, preco)
                  WHERE i.nome = 'Batata com Alecrim'`
        },
        // Alérgenos
        {
            name: 'Alérgenos - Smash Bacon',
            sql: `INSERT INTO cardapio_itens_alergenos (id_item, id_alergeno)
                  SELECT i.id_item, a.id_alergeno FROM cardapio_itens i, alergenos a
                  WHERE i.nome = 'Smash Bacon Supreme' AND a.nome IN ('Glúten', 'Lactose')
                  ON CONFLICT DO NOTHING`
        },
        {
            name: 'Alérgenos - Double Cheese',
            sql: `INSERT INTO cardapio_itens_alergenos (id_item, id_alergeno)
                  SELECT i.id_item, a.id_alergeno FROM cardapio_itens i, alergenos a
                  WHERE i.nome = 'Double Cheese Monster' AND a.nome IN ('Glúten', 'Lactose')
                  ON CONFLICT DO NOTHING`
        },
        {
            name: 'Alérgenos - Nuggets',
            sql: `INSERT INTO cardapio_itens_alergenos (id_item, id_alergeno)
                  SELECT i.id_item, a.id_alergeno FROM cardapio_itens i, alergenos a
                  WHERE i.nome = 'Nuggets Artesanais' AND a.nome IN ('Glúten', 'Ovos')
                  ON CONFLICT DO NOTHING`
        },
        {
            name: 'Alérgenos - Milkshake',
            sql: `INSERT INTO cardapio_itens_alergenos (id_item, id_alergeno)
                  SELECT i.id_item, a.id_alergeno FROM cardapio_itens i, alergenos a
                  WHERE i.nome = 'Milkshake Nutella' AND a.nome IN ('Lactose', 'Nozes')
                  ON CONFLICT DO NOTHING`
        },
    ];

    try {
        for (const step of steps) {
            process.stdout.write(`  [${step.name}]... `);
            await client.query(step.sql);
            console.log('OK');
        }

        // Verificação final
        const mesas = await client.query('SELECT COUNT(*) FROM mesas');
        const menu = await client.query('SELECT COUNT(*) FROM cardapio_itens');
        const adicionais = await client.query('SELECT COUNT(*) FROM cardapio_itens_adicionais');

        console.log('\n=== Resumo ===');
        console.log(`Mesas: ${mesas.rows[0].count}`);
        console.log(`Itens no menu: ${menu.rows[0].count}`);
        console.log(`Adicionais: ${adicionais.rows[0].count}`);
        console.log('\nSeed concluído com sucesso!');

    } catch (err) {
        console.error('\nErro no seed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
