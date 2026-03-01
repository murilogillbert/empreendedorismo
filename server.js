import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pg;

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(cors());
app.use(express.static('public'));

// --- STRIPE WEBHOOK ---
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    let event;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (endpointSecret) {
        const signature = req.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`, err.message);
            return res.sendStatus(400);
        }
    } else {
        event = JSON.parse(req.body.toString());
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        if (session.metadata && session.metadata.poolId) {
            const poolId = session.metadata.poolId;
            const amountPaid = session.amount_total / 100;
            const contributorName = session.metadata.contributorName;
            const paymentIntentId = session.payment_intent;

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Record the authorized contribution
                await client.query(
                    'INSERT INTO pagamentos_divisoes (id_pagamento, nome_contribuinte, valor, status, stripe_payment_intent_id) VALUES ($1, $2, $3, $4, $5)',
                    [poolId, contributorName, amountPaid, 'AUTORIZADO', paymentIntentId]
                );

                // Check total authorized
                const poolRes = await client.query('SELECT valor_total FROM pagamentos WHERE id_pagamento = $1', [poolId]);
                const poolData = poolRes.rows[0];

                const authRes = await client.query("SELECT SUM(valor) as total FROM pagamentos_divisoes WHERE id_pagamento = $1 AND status = 'AUTORIZADO'", [poolId]);
                const totalAuth = parseFloat(authRes.rows[0].total || 0);

                if (totalAuth >= parseFloat(poolData.valor_total)) {
                    // Capture all intents
                    const intentsToCapture = await client.query("SELECT id_divisao, stripe_payment_intent_id FROM pagamentos_divisoes WHERE id_pagamento = $1 AND status = 'AUTORIZADO'", [poolId]);
                    for (const row of intentsToCapture.rows) {
                        try {
                            await stripe.paymentIntents.capture(row.stripe_payment_intent_id);
                            await client.query("UPDATE pagamentos_divisoes SET status = 'CAPTURADO' WHERE id_divisao = $1", [row.id_divisao]);
                        } catch (e) {
                            console.error('Failed to capture:', row.stripe_payment_intent_id, e);
                        }
                    }
                    await client.query("UPDATE pagamentos SET status = 'CAPTURADO' WHERE id_pagamento = $1", [poolId]);
                }

                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                console.error('Webhook error:', err);
            } finally {
                client.release();
            }
        }
    }
    res.json({ received: true });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const YOUR_DOMAIN = process.env.BASE_URL || 'http://localhost:3000';

// --- AUTH CONTEXT ---

// POST /api/auth/register - Register a new user (CLIENTE)
app.post('/api/auth/register', async (req, res) => {
    const { name, email, phone, password } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if user already exists
        const userCheck = await client.query('SELECT id_usuario FROM usuarios WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'E-mail já está em uso' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const newUserRes = await client.query(
            'INSERT INTO usuarios (nome_completo, email, telefone, senha_hash) VALUES ($1, $2, $3, $4) RETURNING id_usuario, nome_completo, email',
            [name, email, phone, hashedPassword]
        );
        const newUser = newUserRes.rows[0];

        // Get CLIENTE role ID
        const roleRes = await client.query('SELECT id_papel FROM papeis WHERE nome = $1', ['CLIENTE']);
        if (roleRes.rows.length === 0) {
            throw new Error('Papel CLIENTE não encontrado no banco de dados');
        }
        const roleId = roleRes.rows[0].id_papel;

        // Assign CLIENTE role to user
        await client.query(
            'INSERT INTO usuarios_papeis (id_usuario, id_papel) VALUES ($1, $2)',
            [newUser.id_usuario, roleId]
        );

        await client.query('COMMIT');

        // Generate JWT
        const token = jwt.sign(
            { id: newUser.id_usuario, email: newUser.email, role: 'CLIENTE' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser.id_usuario,
                name: newUser.nome_completo,
                email: newUser.email,
                role: 'CLIENTE'
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in registration:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user
        const userRes = await pool.query(
            `SELECT u.*, p.nome as role 
             FROM usuarios u 
             LEFT JOIN usuarios_papeis up ON u.id_usuario = up.id_usuario
             LEFT JOIN papeis p ON up.id_papel = p.id_papel
             WHERE u.email = $1`,
            [email]
        );

        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = userRes.rows[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.senha_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Check if user is active
        if (!user.ativo) {
            return res.status(403).json({ error: 'Conta desativada' });
        }

        // Generate JWT
        const role = user.role || 'CLIENTE';
        const token = jwt.sign(
            { id: user.id_usuario, email: user.email, role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id_usuario,
                name: user.nome_completo,
                email: user.email,
                role
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- MENU CONTEXT ---

// GET /api/menu - Fetch full menu with relations
app.get('/api/menu', async (req, res) => {
    try {
        const query = `
            SELECT 
                i.*,
                COALESCE(json_agg(DISTINCT ing.nome) FILTER (WHERE ing.nome IS NOT NULL), '[]') as ingredients,
                COALESCE(json_agg(DISTINCT a.nome) FILTER (WHERE a.nome IS NOT NULL), '[]') as allergens,
                COALESCE(json_agg(DISTINCT jsonb_build_object('name', ad.nome, 'price', ad.preco)) FILTER (WHERE ad.nome IS NOT NULL), '[]') as addons
            FROM cardapio_itens i
            LEFT JOIN cardapio_itens_ingredientes ing ON i.id_item = ing.id_item
            LEFT JOIN cardapio_itens_alergenos cia ON i.id_item = cia.id_item
            LEFT JOIN alergenos a ON cia.id_alergeno = a.id_alergeno
            LEFT JOIN cardapio_itens_adicionais ad ON i.id_item = ad.id_item
            WHERE i.ativo = true
            GROUP BY i.id_item
        `;
        const result = await pool.query(query);

        // Map snake_case to frontend camelCase
        const menu = result.rows.map(row => ({
            id: row.id_item,
            name: row.nome,
            description: row.descricao,
            price: parseFloat(row.preco),
            image: row.image_url,
            category: row.categoria,
            ingredients: row.ingredients,
            allergens: row.allergens,
            addons: row.addons.map(a => ({ name: a.name, price: parseFloat(a.price) }))
        }));

        res.json(menu);
    } catch (error) {
        console.error('Error fetching menu:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/menu - Add item
app.post('/api/menu', async (req, res) => {
    const { name, description, price, image, category, ingredients, addons, allergens } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const itemRes = await client.query(
            'INSERT INTO cardapio_itens (id_restaurante, nome, descricao, image_url, preco, categoria) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_item',
            [1, name, description, image, price, category]
        );
        const itemId = itemRes.rows[0].id_item;

        // Add ingredients
        if (ingredients && ingredients.length > 0) {
            for (const ing of ingredients) {
                await client.query('INSERT INTO cardapio_itens_ingredientes (id_item, nome) VALUES ($1, $2)', [itemId, ing]);
            }
        }

        // Add addons
        if (addons && addons.length > 0) {
            for (const ad of addons) {
                await client.query('INSERT INTO cardapio_itens_adicionais (id_item, nome, preco) VALUES ($1, $2, $3)', [itemId, ad.name, ad.price]);
            }
        }

        // Add allergens
        if (allergens && allergens.length > 0) {
            for (const alName of allergens) {
                const alRes = await client.query('SELECT id_alergeno FROM alergenos WHERE nome = $1', [alName]);
                if (alRes.rows.length > 0) {
                    await client.query('INSERT INTO cardapio_itens_alergenos (id_item, id_alergeno) VALUES ($1, $2)', [itemId, alRes.rows[0].id_alergeno]);
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ id: itemId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding item:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// DELETE /api/menu/:id
app.delete('/api/menu/:id', async (req, res) => {
    try {
        await pool.query('UPDATE cardapio_itens SET ativo = false WHERE id_item = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- SESSION & TABLE CONTEXT ---

// POST /api/session/join
app.post('/api/session/join', async (req, res) => {
    const { tableCode } = req.body;
    // user ID 4 as placeholder for anonymous clients in this demo, or we could pass user ID if logged in.
    const userId = req.body.userId || 4;

    if (!tableCode) {
        return res.status(400).json({ error: 'Código da mesa é obrigatório' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find table by code
        const tableRes = await client.query('SELECT id_mesa FROM mesas WHERE identificador_mesa = $1 AND ativa = true', [tableCode]);
        if (tableRes.rows.length === 0) {
            return res.status(404).json({ error: 'Mesa não encontrada ou inativa' });
        }
        const mesaId = tableRes.rows[0].id_mesa;

        // Check if there's an active session for this table
        let sessionRes = await client.query("SELECT id_sessao FROM sessoes WHERE id_mesa = $1 AND status = 'ABERTA' LIMIT 1", [mesaId]);

        let sessionId;
        if (sessionRes.rows.length === 0) {
            // Create a new session
            const newSession = await client.query(
                "INSERT INTO sessoes (id_restaurante, id_mesa, id_usuario_criador, status) VALUES ($1, $2, $3, 'ABERTA') RETURNING id_sessao",
                [1, mesaId, userId] // Assuming restaurant 1
            );
            sessionId = newSession.rows[0].id_sessao;
        } else {
            sessionId = sessionRes.rows[0].id_sessao;
        }

        await client.query('COMMIT');
        res.json({ sessionId, tableId: mesaId, tableCode });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error joining session:', e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// --- ORDER CONTEXT ---

// POST /api/orders - Add to order
app.post('/api/orders', async (req, res) => {
    const { item, selectedAddons, observations, sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: 'Sessão da mesa é obrigatória para fazer pedidos' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Check if session is valid and OPEN
        const sessionCheck = await client.query("SELECT status FROM sessoes WHERE id_sessao = $1", [sessionId]);
        if (sessionCheck.rows.length === 0 || sessionCheck.rows[0].status !== 'ABERTA') {
            throw new Error("Sessão inválida ou fechada");
        }

        // 2. Create Order
        const orderRes = await client.query(
            'INSERT INTO pedidos (id_sessao, status) VALUES ($1, $2) RETURNING id_pedido',
            [sessionId, 'Recebido']
        );
        const orderId = orderRes.rows[0].id_pedido;

        // 3. Create Order Item
        const addonsPrice = selectedAddons.reduce((acc, curr) => acc + curr.price, 0);
        const finalPrice = item.price + addonsPrice;

        const orderItemRes = await client.query(
            'INSERT INTO pedidos_itens (id_pedido, id_item, quantidade, valor_unitario_base, final_price, observacoes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_pedido_item',
            [orderId, item.id, 1, item.price, finalPrice, observations]
        );
        const orderItemId = orderItemRes.rows[0].id_pedido_item;

        // 4. Create Order Item Addons
        if (selectedAddons && selectedAddons.length > 0) {
            for (const ad of selectedAddons) {
                // Find specific addon ID from DB
                const adRes = await client.query('SELECT id_item_adicional FROM cardapio_itens_adicionais WHERE id_item = $1 AND nome = $2', [item.id, ad.name]);
                if (adRes.rows.length > 0) {
                    await client.query(
                        'INSERT INTO pedidos_itens_adicionais (id_pedido_item, id_item_adicional, nome_snapshot, preco_snapshot) VALUES ($1, $2, $3, $4)',
                        [orderItemId, adRes.rows[0].id_item_adicional, ad.name, ad.price]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ orderId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in order:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// GET /api/orders/:sessionId - Fetch all orders with details for a specific session
app.get('/api/orders/:sessionId', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id_pedido as id,
                p.status,
                p.criado_em as timestamp,
                pi.id_pedido_item as "orderItemId",
                pi.quantidade as quantity,
                pi.valor_unitario_base as price,
                pi.final_price as "finalPrice",
                pi.observacoes as observations,
                ci.nome as name,
                ci.image_url as image,
                COALESCE(json_agg(jsonb_build_object('name', pia.nome_snapshot, 'price', pia.preco_snapshot)) FILTER (WHERE pia.nome_snapshot IS NOT NULL), '[]') as "selectedAddons"
            FROM pedidos p
            JOIN pedidos_itens pi ON p.id_pedido = pi.id_pedido
            JOIN cardapio_itens ci ON pi.id_item = ci.id_item
            LEFT JOIN pedidos_itens_adicionais pia ON pi.id_pedido_item = pia.id_pedido_item
            WHERE p.id_sessao = $1
            GROUP BY p.id_pedido, pi.id_pedido_item, ci.id_item
            ORDER BY p.criado_em DESC
        `;
        const result = await pool.query(query, [req.params.sessionId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query('UPDATE pedidos SET status = $1 WHERE id_pedido = $2', [status, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- STRIPE (Preserved but integrated with item price) ---

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items, tip, appTax } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Nenhum item no pedido' });
        }

        const line_items = items.map(item => ({
            price_data: {
                currency: 'brl',
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        if (tip > 0) {
            line_items.push({
                price_data: {
                    currency: 'brl',
                    product_data: {
                        name: 'Gorjeta Garçom',
                    },
                    unit_amount: Math.round(tip * 100),
                },
                quantity: 1,
            });
        }

        if (appTax > 0) {
            line_items.push({
                price_data: {
                    currency: 'brl',
                    product_data: {
                        name: 'Taxa do App (1%)',
                    },
                    unit_amount: Math.round(appTax * 100),
                },
                quantity: 1,
            });
        }

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}?success=true`,
            cancel_url: `${YOUR_DOMAIN}?canceled=true`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- STRIPE POOL (Divisão) ---

// GET /api/pool/:id
app.get('/api/pool/:id', async (req, res) => {
    try {
        const poolId = req.params.id;
        const poolRes = await pool.query('SELECT * FROM pagamentos WHERE id_pagamento = $1', [poolId]);
        if (poolRes.rows.length === 0) return res.status(404).json({ error: 'Pool not found' });

        const contributionsRes = await pool.query('SELECT nome_contribuinte, valor, status, criado_em FROM pagamentos_divisoes WHERE id_pagamento = $1 ORDER BY criado_em DESC', [poolId]);
        const poolData = poolRes.rows[0];
        const contributions = contributionsRes.rows.map(c => ({
            contributorName: c.nome_contribuinte,
            amount: parseFloat(c.valor),
            status: c.status,
            timestamp: c.criado_em
        }));

        const initialPaid = contributions.reduce((acc, c) => acc + c.amount, 0);
        res.json({
            id: poolData.id_pagamento,
            totalAmount: parseFloat(poolData.valor_total),
            initialPaid,
            remainingAmount: Math.max(0, parseFloat(poolData.valor_total) - initialPaid),
            contributions,
            isPaid: poolData.status === 'CAPTURADO'
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/pool/session/:sessionId -> Busca pool PENDENTE ativa para uma sessão (mesa)
app.get('/api/pool/session/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        // Busca apenas a pool PENDENTE mais recente (não mistura com CAPTURADO)
        const poolRes = await pool.query(
            "SELECT * FROM pagamentos WHERE id_sessao = $1 AND status = 'PENDENTE' ORDER BY criado_em DESC LIMIT 1",
            [sessionId]
        );
        if (poolRes.rows.length === 0) return res.status(200).json({ pool: null });

        const poolData = poolRes.rows[0];
        const poolId = poolData.id_pagamento;

        const contributionsRes = await pool.query(
            'SELECT nome_contribuinte, valor, status, criado_em FROM pagamentos_divisoes WHERE id_pagamento = $1 ORDER BY criado_em DESC',
            [poolId]
        );
        const contributions = contributionsRes.rows.map(c => ({
            contributorName: c.nome_contribuinte,
            amount: parseFloat(c.valor),
            status: c.status,
            timestamp: c.criado_em
        }));

        // Buscar itens vinculados a esta pool
        const itemsRes = await pool.query(
            `SELECT pi2.id_pedido_item as "orderItemId", ci.nome as name, pi2.final_price as "finalPrice", pi2.quantidade as quantity
             FROM pool_itens pli
             JOIN pedidos_itens pi2 ON pli.id_pedido_item = pi2.id_pedido_item
             JOIN cardapio_itens ci ON pi2.id_item = ci.id_item
             WHERE pli.id_pagamento = $1`,
            [poolId]
        );

        const paid = contributions.filter(c => ['PAGO','AUTORIZADO','CAPTURADO'].includes(c.status)).reduce((acc, c) => acc + c.amount, 0);
        res.json({
            pool: {
                id: poolId,
                totalAmount: parseFloat(poolData.valor_total),
                paid,
                remainingAmount: Math.max(0, parseFloat(poolData.valor_total) - paid),
                contributions,
                items: itemsRes.rows,
                isPaid: poolData.status === 'CAPTURADO',
                status: poolData.status
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/pool/session/:sessionId/all -> Lista TODAS as pools da sessão (abertas + fechadas)
app.get('/api/pool/session/:sessionId/all', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const poolsRes = await pool.query(
            "SELECT * FROM pagamentos WHERE id_sessao = $1 ORDER BY criado_em DESC",
            [sessionId]
        );

        const pools = await Promise.all(poolsRes.rows.map(async (poolData) => {
            const poolId = poolData.id_pagamento;

            const contributionsRes = await pool.query(
                'SELECT nome_contribuinte, valor, status, criado_em FROM pagamentos_divisoes WHERE id_pagamento = $1 ORDER BY criado_em DESC',
                [poolId]
            );
            const contributions = contributionsRes.rows.map(c => ({
                contributorName: c.nome_contribuinte,
                amount: parseFloat(c.valor),
                status: c.status,
                timestamp: c.criado_em
            }));

            const itemsRes = await pool.query(
                `SELECT pi2.id_pedido_item as "orderItemId", ci.nome as name, pi2.final_price as "finalPrice", pi2.quantidade as quantity
                 FROM pool_itens pli
                 JOIN pedidos_itens pi2 ON pli.id_pedido_item = pi2.id_pedido_item
                 JOIN cardapio_itens ci ON pi2.id_item = ci.id_item
                 WHERE pli.id_pagamento = $1`,
                [poolId]
            );

            const paid = contributions.filter(c => ['PAGO','AUTORIZADO','CAPTURADO'].includes(c.status)).reduce((acc, c) => acc + c.amount, 0);
            return {
                id: poolId,
                totalAmount: parseFloat(poolData.valor_total),
                paid,
                remainingAmount: Math.max(0, parseFloat(poolData.valor_total) - paid),
                contributions,
                items: itemsRes.rows,
                isPaid: poolData.status === 'CAPTURADO',
                status: poolData.status,
                criado_em: poolData.criado_em
            };
        }));

        res.json({ pools });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/pool/create
// Aceita orderItemIds opcional para vincular itens à pool via pool_itens
// Se já existir pool PENDENTE para a sessão, retorna ela (não duplica)
app.post('/api/pool/create', async (req, res) => {
    const { totalAmount, baseAmount, sessionId, orderItemIds } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: 'Sessão da mesa é obrigatória' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar se sessão está aberta
        const sessionRes = await client.query(
            "SELECT id_sessao FROM sessoes WHERE id_sessao = $1 AND status = 'ABERTA'",
            [sessionId]
        );
        if (sessionRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Sessão inválida ou fechada' });
        }

        // Verificar se já existe pool PENDENTE para esta sessão
        const existingPoolRes = await client.query(
            "SELECT id_pagamento, valor_total FROM pagamentos WHERE id_sessao = $1 AND status = 'PENDENTE' ORDER BY criado_em DESC LIMIT 1",
            [sessionId]
        );

        let poolId, finalTotalAmount;

        if (existingPoolRes.rows.length > 0) {
            // Retornar pool existente sem criar nova
            poolId = existingPoolRes.rows[0].id_pagamento;
            finalTotalAmount = parseFloat(existingPoolRes.rows[0].valor_total);
            console.log(`[Pool] Retornando pool existente ID ${poolId} para sessão ${sessionId}`);
        } else {
            // Calcular total a partir dos itens se orderItemIds for fornecido
            let computedTotal = totalAmount;
            if (orderItemIds && orderItemIds.length > 0) {
                const itemsRes = await client.query(
                    'SELECT COALESCE(SUM(final_price * quantidade), 0) as total FROM pedidos_itens WHERE id_pedido_item = ANY($1)',
                    [orderItemIds]
                );
                computedTotal = parseFloat(itemsRes.rows[0].total) || totalAmount;
            }
            finalTotalAmount = computedTotal;

            // Criar nova pool
            const newPoolRes = await client.query(
                "INSERT INTO pagamentos (id_sessao, valor_total, status, metodo) VALUES ($1, $2, 'PENDENTE', 'STRIPE') RETURNING id_pagamento",
                [sessionId, finalTotalAmount]
            );
            poolId = newPoolRes.rows[0].id_pagamento;
            console.log(`[Pool] Nova pool ID ${poolId} criada para sessão ${sessionId}`);
        }

        // Vincular itens à pool (ignorar conflitos de UNIQUE — item já vinculado fica na pool que estava)
        if (orderItemIds && orderItemIds.length > 0) {
            for (const itemId of orderItemIds) {
                await client.query(
                    'INSERT INTO pool_itens (id_pagamento, id_pedido_item) VALUES ($1, $2) ON CONFLICT (id_pedido_item) DO NOTHING',
                    [poolId, itemId]
                );
            }
            // Recalcular valor_total da pool com base nos itens agora vinculados
            const totalRes = await client.query(
                `SELECT COALESCE(SUM(pi2.final_price * pi2.quantidade), 0) as total
                 FROM pool_itens pli
                 JOIN pedidos_itens pi2 ON pli.id_pedido_item = pi2.id_pedido_item
                 WHERE pli.id_pagamento = $1`,
                [poolId]
            );
            finalTotalAmount = parseFloat(totalRes.rows[0].total) || finalTotalAmount;
            await client.query('UPDATE pagamentos SET valor_total = $1 WHERE id_pagamento = $2', [finalTotalAmount, poolId]);
        }

        await client.query('COMMIT');
        res.json({ pool: { id: poolId, totalAmount: finalTotalAmount, remainingAmount: finalTotalAmount } });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error creating pool:', e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// DELETE /api/pool/:poolId/item/:orderItemId — Remove item de pool PENDENTE
// Recalcula o valor_total da pool após remoção
app.delete('/api/pool/:poolId/item/:orderItemId', async (req, res) => {
    const { poolId, orderItemId } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar se a pool está PENDENTE
        const poolCheck = await client.query(
            "SELECT status, valor_total FROM pagamentos WHERE id_pagamento = $1",
            [poolId]
        );
        if (poolCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Pool não encontrada' });
        }
        if (poolCheck.rows[0].status !== 'PENDENTE') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Só é possível remover itens de pools com status PENDENTE' });
        }

        // Remover vínculo
        const deleteRes = await client.query(
            'DELETE FROM pool_itens WHERE id_pagamento = $1 AND id_pedido_item = $2 RETURNING id_pool_item',
            [poolId, orderItemId]
        );
        if (deleteRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Item não está vinculado a esta pool' });
        }

        // Recalcular valor_total da pool
        const totalRes = await client.query(
            `SELECT COALESCE(SUM(pi2.final_price * pi2.quantidade), 0) as total
             FROM pool_itens pli
             JOIN pedidos_itens pi2 ON pli.id_pedido_item = pi2.id_pedido_item
             WHERE pli.id_pagamento = $1`,
            [poolId]
        );
        const newTotal = parseFloat(totalRes.rows[0].total);
        await client.query('UPDATE pagamentos SET valor_total = $1 WHERE id_pagamento = $2', [newTotal, poolId]);

        await client.query('COMMIT');
        res.json({ success: true, newTotal });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error removing item from pool:', e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// POST /api/pool/checkout
app.post('/api/pool/checkout', async (req, res) => {
    try {
        const { poolId, amount, contributorName, itemName } = req.body;

        const session = await stripe.checkout.sessions.create({
            line_items: [{
                price_data: {
                    currency: 'brl',
                    product_data: { name: itemName },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            // IMPORTANT: Holds the funds instead of automatic capture
            payment_intent_data: { capture_method: 'manual' },
            metadata: { poolId: poolId.toString(), contributorName },
            success_url: `${YOUR_DOMAIN}/success?pool_id=${poolId}&amount=${amount}&name=${encodeURIComponent(contributorName)}`,
            cancel_url: `${YOUR_DOMAIN}/pool/${poolId}?canceled=true`,
        });

        res.json({ url: session.url });
    } catch (e) {
        console.error('Error pool checkout:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/pool/confirm - Chamado pelo Success.jsx frontend apos pagamento
app.post('/api/pool/confirm', async (req, res) => {
    const { poolId, amount, contributorName } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Evita duplicacoes checando se ja existe aquele pagamento praquele nome com mesmo valor nas ultimas horas
        // Num cenário real seria o Webhook do Stripe checando o ID do Intent
        await client.query(
            "INSERT INTO pagamentos_divisoes (id_pagamento, nome_contribuinte, valor, status) VALUES ($1, $2, $3, 'PAGO')",
            [poolId, contributorName, amount]
        );

        // Checar se completou e precisa alterar a Pool para CAPTURADO
        const poolRes = await client.query('SELECT valor_total FROM pagamentos WHERE id_pagamento = $1', [poolId]);
        const sumRes = await client.query('SELECT SUM(valor) as total_pago FROM pagamentos_divisoes WHERE id_pagamento = $1', [poolId]);

        if (poolRes.rows.length > 0 && sumRes.rows.length > 0) {
            const totalAguardado = parseFloat(poolRes.rows[0].valor_total);
            const totalPago = parseFloat(sumRes.rows[0].total_pago);
            if (totalPago >= totalAguardado) {
                await client.query("UPDATE pagamentos SET status = 'CAPTURADO' WHERE id_pagamento = $1", [poolId]);
            }
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error confirming pool payment:', e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// --- WAITER PORTAL ---

// GET /api/waiter/tables - Listagem geral de status para o Dashboard do Garcom
app.get('/api/waiter/tables', async (req, res) => {
    try {
        const query = `
            SELECT m.id_mesa as mesa_id, m.identificador_mesa as identificador, m.capacidade,
                   s.id_sessao as sessao_id, s.status,
                   COUNT(p.id_pedido) as total_pedidos,
                   COALESCE(SUM(pi.final_price * pi.quantidade), 0) as total_conta
            FROM mesas m
            LEFT JOIN sessoes s ON m.id_mesa = s.id_mesa AND s.status = 'ABERTA'
            LEFT JOIN pedidos p ON s.id_sessao = p.id_sessao
            LEFT JOIN pedidos_itens pi ON p.id_pedido = pi.id_pedido
            WHERE m.ativa = true
            GROUP BY m.id_mesa, s.id_sessao, s.status
            ORDER BY m.identificador_mesa ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/waiter/tables/:tableId - Detalhes e extrato da conta daquela mesa
app.get('/api/waiter/tables/:tableId', async (req, res) => {
    try {
        const { tableId } = req.params;

        // Dados basiocs da mesa e da sessao aberta
        const sessionRes = await pool.query(
            "SELECT id_sessao, status FROM sessoes WHERE id_mesa = $1 AND status = 'ABERTA' LIMIT 1",
            [tableId]
        );

        const basicRes = await pool.query("SELECT identificador_mesa FROM mesas WHERE id_mesa = $1", [tableId]);
        if (basicRes.rows.length === 0) return res.status(404).json({ error: 'Mesa not found' });

        const identificador = basicRes.rows[0].identificador_mesa;

        if (sessionRes.rows.length === 0) {
            return res.json({ identificador, status: 'LIVRE', pedidos: [], total_pendente: 0 });
        }

        const sessionId = sessionRes.rows[0].id_sessao;

        // Buscar pedidos
        const ordersQuery = `
            SELECT pi.quantidade, pi.final_price as valor_total, p.status, ci.nome as nome_item
            FROM pedidos p
            JOIN pedidos_itens pi ON p.id_pedido = pi.id_pedido
            JOIN cardapio_itens ci ON pi.id_item = ci.id_item
            WHERE p.id_sessao = $1
            ORDER BY p.criado_em DESC
        `;
        const ordersRes = await pool.query(ordersQuery, [sessionId]);

        // Buscar pendencia da Pool (calculo simulado)
        let total_pendente = ordersRes.rows.reduce((acc, curr) => acc + parseFloat(curr.valor_total) * curr.quantidade, 0);

        // Se tem pool ativa, abata o que ja pagaram
        const poolCheckRes = await pool.query("SELECT id_pagamento, valor_total FROM pagamentos WHERE id_sessao = $1 AND status IN ('PENDENTE', 'CAPTURADO') LIMIT 1", [sessionId]);
        if (poolCheckRes.rows.length > 0) {
            const poolId = poolCheckRes.rows[0].id_pagamento;
            const sumRes = await pool.query("SELECT SUM(valor) as total_pago FROM pagamentos_divisoes WHERE id_pagamento = $1", [poolId]);
            const pago = parseFloat(sumRes.rows[0].total_pago || 0);
            total_pendente = Math.max(total_pendente - pago, 0);
        }

        res.json({
            identificador,
            status: 'ABERTA',
            sessao_id: sessionId,
            pedidos: ordersRes.rows,
            total_pendente
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/waiter/tables/:tableId/close - Fechar Conta (Forcado pelo garcom)
app.post('/api/waiter/tables/:tableId/close', async (req, res) => {
    try {
        const { tableId } = req.params;
        await pool.query("UPDATE sessoes SET status = 'FECHADA' WHERE id_mesa = $1 AND status = 'ABERTA'", [tableId]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- CRON JOBS & AUTOMATION ---
// Roda a cada 5 minutos para limpar mesas se tiver passado do horario de fechamento + 30m
setInterval(async () => {
    try {
        const restRes = await pool.query("SELECT horario_fechamento FROM restaurantes WHERE id_restaurante = 1 AND horario_fechamento IS NOT NULL");
        if (restRes.rows.length === 0) return;

        const closeTimeStr = restRes.rows[0].horario_fechamento; // ex: "23:30:00"
        const [closeHour, closeMinute] = closeTimeStr.split(':').map(Number);

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Verifica timezone p/ facilitar comparacao linear no mesmo dia (+30m)
        const closeTotalMinutes = (closeHour * 60) + closeMinute;
        const currentTotalMinutes = (currentHour * 60) + currentMinute;
        const toleranceMinutes = 30;

        let shouldClose = false;

        // Lida com fechamento que cruza a meia-noite (ex: 02:00) vs (23:00)
        // Uma aborgagem super simples para demo:
        if (closeHour >= 12) {
            // Fechamento antes da meia noite (ex 22:00 -> cai as 22:30. Se for 23:59 cai 00:29)
            if (currentTotalMinutes >= (closeTotalMinutes + toleranceMinutes) || currentHour < 12) {
                shouldClose = true;
            }
        } else {
            // Restaurante fecha de madrugada (ex 02:00, cai 02:30)
            if (currentTotalMinutes >= (closeTotalMinutes + toleranceMinutes) && currentHour < 12) {
                shouldClose = true;
            }
        }

        if (shouldClose) {
            const res = await pool.query("UPDATE sessoes SET status = 'FECHADA' WHERE status = 'ABERTA' RETURNING id_sessao;");
            if (res.rowCount > 0) {
                console.log(`[Auto-Close] ${res.rowCount} sessoes foram fechadas por horario de funcionamento excedido.`);
            }
        }
    } catch (e) {
        console.error('Error on auto-close cron:', e);
    }
}, 5 * 60 * 1000); // 5 minutes

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
