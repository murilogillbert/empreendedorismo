-- =====================================================
-- Script de Dados de Teste EXPANDIDO - Sistema de Gestão de Restaurantes
-- PostgreSQL
-- =====================================================

-- 1. USUÁRIOS (Clientes, Gerentes, Cozinheiros e Garçons)
INSERT INTO usuarios (nome_completo, email, telefone, senha_hash) VALUES
('Admin Geral', 'admin@restaurante.com', '11999999999', 'hash_admin'),
('Carlos Chef', 'carlos@kitchen.com', '11911111111', 'hash_chef'),
('Ricardo Garçom', 'ricardo@atendimento.com', '11922222222', 'hash_garcom'),
('João Silva', 'joao@email.com', '11933333333', 'hash_joao'),
('Maria Oliveira', 'maria@email.com', '11944444444', 'hash_maria'),
('Pedro Souza', 'pedro@email.com', '11955555555', 'hash_pedro'),
('Ana Costa', 'ana@email.com', '11966666666', 'hash_ana'),
('Beatriz Lima', 'beatriz@email.com', '11977777777', 'hash_beatriz'),
('Lucas Rocha', 'lucas@email.com', '11988888888', 'hash_lucas');

-- 2. ATRIBUIR PAPÉIS (ADMIN:1, COZINHA:2, CLIENTE:3)
INSERT INTO usuarios_papeis (id_usuario, id_papel) VALUES
(1, 1), -- Admin
(2, 2), -- Carlos (Cozinha)
(3, 2), -- Ricardo (Atuando como staff)
(4, 3), (5, 3), (6, 3), (7, 3), (8, 3), (9, 3); -- Clientes

-- 3. RESTAURANTES
INSERT INTO restaurantes (nome_fantasia, cnpj, logradouro, cidade, estado) VALUES
('Vite Gourmet Burger', '12.345.678/0001-90', 'Av. Paulista, 1000', 'São Paulo', 'SP'),
('Cantina Bella Italia', '98.765.432/0001-11', 'Rua Augusta, 500', 'São Paulo', 'SP');

-- Configurações de Pagamento
INSERT INTO restaurantes_config_pagamento (id_restaurante, taxa_servico_percentual, taxa_plataforma_percentual) VALUES
(1, 12.00, 1.00),
(2, 10.00, 1.00);

-- 4. MESAS (Vite Gourmet)
INSERT INTO mesas (id_restaurante, identificador_mesa, capacidade) VALUES
(1, 'Mesa 01', 2), (1, 'Mesa 02', 2), (1, 'Mesa 03', 4), (1, 'Mesa 04', 4), (1, 'Mesa 05', 6), (1, 'VIP 01', 8);

-- 5. ALÉRGENOS (Já inseridos pelo bd.sql, mas garantindo IDs)
-- Glúten(1), Lactose(2), Amendoim(3), Ovos(4), Peixes(5), Soja(6), Nozes(7)

-- 6. CARDÁPIO - VITE GOURMET BURGER
INSERT INTO cardapio_itens (id_restaurante, nome, descricao, image_url, preco, categoria) VALUES
-- Hambúrgueres
(1, 'Smash Bacon Supreme', 'Dois blends de 80g, cheddar, bacon caramelizado e maionese defumada.', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5', 34.90, 'Hambúrgueres'),
(1, 'Double Cheese Monster', 'Três blends, triplo cheddar, cebola roxa e picles de jalapeño.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd', 42.00, 'Hambúrgueres'),
(1, 'Veggie Delight', 'Hambúrguer de falafel, hummus de beterraba, espinafre e tomate seco.', 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2', 31.00, 'Hambúrgueres'),
-- Entradas
(1, 'Nuggets Artesanais', '6 unidades de frango marinado acompanhados de molho honey mustard.', 'https://images.unsplash.com/photo-1562967914-6cbb242c7dfa', 22.00, 'Entradas'),
(1, 'Batata com Alecrim', 'Porção individual de batatas rústicas fritas no óleo de algodão.', 'https://images.unsplash.com/photo-1630384066252-1911fa9be2f7', 16.50, 'Entradas'),
-- Bebidas
(1, 'Milkshake Nutella', '500ml de sorvete de baunilha batido com Nutella e avelãs.', 'https://images.unsplash.com/photo-1551024601-bec78acc704b', 26.00, 'Bebidas'),
(1, 'Soda de Maçã Verde', 'Xarope Monin, água com gás e gelo.', 'https://images.unsplash.com/photo-1513558161293-cdaf7659a992', 14.00, 'Bebidas'),
(1, 'Cerveja Artesanal IPA', 'Garrafa 600ml de IPA local bem encorpada.', 'https://images.unsplash.com/photo-1535958636474-b021ee887b13', 28.00, 'Bebidas'),
-- Sobremesas
(1, 'Brownie de Chocolate', 'Servido quente com uma bola de sorvete de creme.', 'https://images.unsplash.com/photo-1564936281291-294551497d81', 21.00, 'Sobremesas');

-- 7. INGREDIENTES (Vite Gourmet)
INSERT INTO cardapio_itens_ingredientes (id_item, nome) VALUES
(1, 'Pão Brioche'), (1, 'Blend 80g x2'), (1, 'Queijo Cheddar'), (1, 'Bacon Caramelizado'), (1, 'Maionese Defumada'),
(2, 'Pão com Gergelim'), (2, 'Blend 80g x3'), (2, 'Queijo Cheddar x3'), (2, 'Picles de Jalapeño'), (2, 'Cebola Roxa'),
(3, 'Cochinha de Falafel'), (3, 'Hummus'), (3, 'Espinafre'), (3, 'Tomate Seco'),
(4, 'Frango'), (4, 'Farinha Panko'), (4, 'Tempero Secreto');

-- 8. ADICIONAIS (Vite Gourmet)
INSERT INTO cardapio_itens_adicionais (id_item, nome, preco) VALUES
(1, 'Ovo Estalado', 3.50), (1, 'Carne Extra', 9.00), (1, 'Cheddar Extra', 4.00),
(2, 'Picles em Dobro', 2.00), (2, 'Bacon Extra', 5.00),
(3, 'Tofu Grelhado', 6.50),
(5, 'Molho de Queijo', 5.00), (5, 'Pó de Páprica', 1.50);

-- 9. ALÉRGENOS NOS ITENS (Vite Gourmet)
INSERT INTO cardapio_itens_alergenos (id_item, id_alergeno) VALUES
(1, 1), (1, 2), -- Smash Bacon: Glúten, Lactose
(2, 1), (2, 2), -- Double Monster: Glúten, Lactose
(4, 1), (4, 4), -- Nuggets: Glúten, Ovos
(6, 2), (6, 7); -- Milkshake: Lactose, Nozes

-- 10. SIMULAR HISTÓRICO DE SESSÕES E PEDIDOS

-- SESSÃO 1: João e Maria (Mesa 03) - Status FECHADA
INSERT INTO sessoes (id_restaurante, id_mesa, id_usuario_criador, status) VALUES
(1, 3, 4, 'FECHADA');

-- Pedido da Sessão 1
INSERT INTO pedidos (id_sessao, status) VALUES (1, 'Entregue');

-- Itens do Pedido 1
-- Smash Bacon com Ovo
INSERT INTO pedidos_itens (id_pedido, id_item, quantidade, valor_unitario_base, final_price, observacoes) VALUES
(1, 1, 1, 34.90, 38.40, 'Carne mal passada');
INSERT INTO pedidos_itens_adicionais (id_pedido_item, id_item_adicional, nome_snapshot, preco_snapshot) VALUES
(1, 1, 'Ovo Estalado', 3.50);

-- Milkshake
INSERT INTO pedidos_itens (id_pedido, id_item, quantidade, valor_unitario_base, final_price) VALUES
(1, 6, 1, 26.00, 26.00);

-- Batata
INSERT INTO pedidos_itens (id_pedido, id_item, quantidade, valor_unitario_base, final_price) VALUES
(1, 5, 1, 16.50, 16.50);

-- Pagamento da Sessão 1 (Dividido)
INSERT INTO pagamentos (id_sessao, valor_total, status, metodo) VALUES
(1, 80.90, 'CAPTURADO', 'CARTAO'); -- (38.40 + 26 + 16.50)
INSERT INTO pagamentos_divisoes (id_pagamento, id_usuario_pagador, valor, status) VALUES
(1, 4, 40.45, 'PAGO'), (1, 5, 40.45, 'PAGO');

-- SESSÃO 2: Pedro e Beatriz (Mesa 05) - Status EM ANDAMENTO
INSERT INTO sessoes (id_restaurante, id_mesa, id_usuario_criador, status) VALUES
(1, 5, 6, 'ABERTA');

-- Pedido 1 da Sessão 2 (Já entregue)
INSERT INTO pedidos (id_sessao, status) VALUES (2, 'Entregue');
INSERT INTO pedidos_itens (id_pedido, id_item, quantidade, valor_unitario_base, final_price) VALUES
(2, 2, 2, 42.00, 84.00); -- Dois Double Monsters

-- Pedido 2 da Sessão 2 (Na Cozinha - Preparando)
INSERT INTO pedidos (id_sessao, status) VALUES (2, 'Preparando');
INSERT INTO pedidos_itens (id_pedido, id_item, quantidade, valor_unitario_base, final_price, observacoes) VALUES
(3, 8, 2, 28.00, 56.00, 'Trazer copos com gelo'); -- Duas Cervejas

-- Fila da Cozinha
INSERT INTO cozinha_filas (id_pedido_item, status) VALUES (4, 'EM_PREPARO'); -- As cervejas

-- SESSÃO 3: Ana Costa (VIP 01) - Status CANCELADA
INSERT INTO sessoes (id_restaurante, id_mesa, id_usuario_criador, status) VALUES
(1, 6, 7, 'CANCELADA');

-- 11. DADOS FINANCEIROS EXTRAS
INSERT INTO taxas_transacao (id_pagamento, valor_api_gateway, valor_plataforma) VALUES
(1, 2.80, 0.81); -- Referente ao Pagamento 1

-- =====================================================
-- FIM DO SCRIPT EXPANDIDO
-- =====================================================
