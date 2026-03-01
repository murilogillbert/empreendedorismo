import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import cors from 'cors';
import PocketBase from 'pocketbase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dns from 'node:dns';

// Force IPv4 for database connections to avoid ENETUNREACH on environments with partial IPv6 support
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

// Helper to ensure admin auth for system operations
async function getAdminPB() {
    if (!pb.authStore.isValid || !pb.authStore.isAdmin) {
        await pb.admins.authWithPassword(
            process.env.PB_ADMIN_EMAIL,
            process.env.PB_ADMIN_PASSWORD
        );
    }
    return pb;
}

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://empreendedorismo-omega.vercel.app'
];

app.use(cors({
    origin: 'https://empreendedorismo-omega.vercel.app', // Sua URL exata da Vercel
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// 2. Middleware manual para garantir que o Preflight (OPTIONS) nunca trave
app.options('*', cors());

// 3. Parsers e Estáticos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

const YOUR_DOMAIN = process.env.BASE_URL || 'http://localhost:3000';

// --- AUTH CONTEXT ---

// POST /api/auth/register - Register a new user
app.post('/api/auth/register', async (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
        const pbAdmin = await getAdminPB();

        // PocketBase handles unique email checks and password hashing
        const userData = {
            email,
            password,
            passwordConfirm: password,
            name,
            phone,
            role: 'CLIENTE' // Default role
        };

        const newUser = await pbAdmin.collection('users').create(userData);

        // Generate JWT (Optionally, we can use PB's own token or a custom one)
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: 'CLIENTE' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: 'CLIENTE'
            }
        });
    } catch (error) {
        console.error('Error in registration:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Authenticate as user with PB
        const authData = await pb.collection('users').authWithPassword(email, password);
        const user = authData.record;

        if (!user.verified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
            return res.status(403).json({ error: 'E-mail não verificado' });
        }

        // Generate custom JWT to maintain compatibility with existing frontend
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'CLIENTE' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'CLIENTE'
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

// --- MENU CONTEXT ---

// GET /api/menu - Fetch full menu
app.get('/api/menu', async (req, res) => {
    try {
        const records = await pb.collection('menu_items').getFullList({
            filter: 'active = true',
            sort: '-created',
        });

        // Map PocketBase fields to frontend camelCase
        const menu = records.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            price: parseFloat(row.price),
            image: row.image_url,
            category: row.category,
            ingredients: row.ingredients || [],
            allergens: row.allergens || [],
            addons: (row.addons || []).map(a => ({ name: a.name, price: parseFloat(a.price) }))
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
    try {
        const pbAdmin = await getAdminPB();

        const data = {
            restaurant: '1', // Placeholder or dynamic
            name,
            description,
            image_url: image,
            price: parseFloat(price),
            category,
            ingredients: ingredients || [],
            allergens: allergens || [],
            addons: addons || [],
            active: true
        };

        const record = await pbAdmin.collection('menu_items').create(data);
        res.status(201).json({ id: record.id });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/menu/:id
app.delete('/api/menu/:id', async (req, res) => {
    try {
        const pbAdmin = await getAdminPB();
        await pbAdmin.collection('menu_items').update(req.params.id, { active: false });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- SESSION & TABLE CONTEXT ---

// POST /api/session/join
app.post('/api/session/join', async (req, res) => {
    const { tableCode } = req.body;
    const userId = req.body.userId || 'anonymous';

    if (!tableCode) {
        return res.status(400).json({ error: 'Código da mesa é obrigatório' });
    }

    try {
        const pbAdmin = await getAdminPB();

        // Find table by code
        const tables = await pbAdmin.collection('tables').getList(1, 1, {
            filter: `identificador_mesa = "${tableCode}" && active = true`
        });

        if (tables.items.length === 0) {
            return res.status(404).json({ error: 'Mesa não encontrada ou inativa' });
        }
        const tableRecord = tables.items[0];

        // Check if there's an active session for this table
        const sessions = await pbAdmin.collection('sessions').getList(1, 1, {
            filter: `table = "${tableRecord.id}" && status = "ABERTA"`,
            sort: '-created'
        });

        let sessionId;
        if (sessions.items.length === 0) {
            // Create a new session
            const newSession = await pbAdmin.collection('sessions').create({
                restaurant: '1',
                table: tableRecord.id,
                creator: userId,
                status: 'ABERTA'
            });
            sessionId = newSession.id;
        } else {
            sessionId = sessions.items[0].id;
        }

        res.json({ sessionId, tableId: tableRecord.id, tableCode });
    } catch (e) {
        console.error('Error joining session:', e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/user/:userId/history - Fetch session history for a specific user
app.get('/api/user/:userId/history', async (req, res) => {
    const { userId } = req.params;
    try {
        const pbAdmin = await getAdminPB();

        // Fetch sessions where user is creator or payer
        // PocketBase doesn't support complex OR filters across related collections easily in one go for totals,
        // so we might need to fetch and then calculate or use a specific view/collection.
        // For now, let's fetch sessions created by the user.
        const sessions = await pbAdmin.collection('sessions').getFullList({
            filter: `creator = "${userId}"`,
            sort: '-created',
            expand: 'table'
        });

        const history = await Promise.all(sessions.map(async (s) => {
            // Calculate session total and user paid (this would be better as a saved field or separate call)
            // For brevity in migration, we'll return the basic info.
            return {
                id: s.id,
                date: s.created,
                table: s.expand?.table?.identificador_mesa || 'N/A',
                status: s.status,
                user_paid: 0, // Placeholder: needs payments query
                session_total: 0 // Placeholder: needs orders query
            };
        }));

        res.json(history);
    } catch (e) {
        console.error('Error fetching user history:', e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/session/:sessionId/details - Fetch full details of a past session
app.get('/api/session/:sessionId/details', async (req, res) => {
    const { sessionId } = req.params;
    try {
        const pbAdmin = await getAdminPB();

        const session = await pbAdmin.collection('sessions').getOne(sessionId, {
            expand: 'table'
        });

        const orders = await pbAdmin.collection('orders').getFullList({
            filter: `session = "${sessionId}" && status != "Cancelado"`,
            expand: 'order_items.menu_item'
        });

        // Map PocketBase orders to expected format
        const mappedOrders = orders.flatMap(o => {
            // PocketBase might have one record per order or multiple items in one record.
            // If order_items is a relation:
            return (o.expand?.order_items || []).map(pi => ({
                id_pedido: o.id,
                order_status: o.status,
                id_pedido_item: pi.id,
                nome: pi.expand?.menu_item?.name || 'Item Removido',
                quantidade: pi.quantity,
                final_price: pi.final_price,
                observacoes: pi.observations
            }));
        });

        const payments = await pbAdmin.collection('payments').getFullList({
            filter: `session = "${sessionId}" && status = "CAPTURADO"`,
            expand: 'payer'
        });

        res.json({
            session: {
                ...session,
                identificador_mesa: session.expand?.table?.identificador_mesa
            },
            orders: mappedOrders,
            payments: payments.map(p => ({
                nome_contribuinte: p.contributor_name,
                valor: p.amount,
                status: p.status,
                criado_em: p.created,
                user_name: p.expand?.payer?.name
            }))
        });
    } catch (e) {
        console.error('Error fetching session details:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- ORDER CONTEXT ---

// POST /api/orders - Add to order
app.post('/api/orders', async (req, res) => {
    const { item, selectedAddons, observations, sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: 'Sessão da mesa é obrigatória para fazer pedidos' });
    }

    try {
        const pbAdmin = await getAdminPB();

        // 1. Check if session is valid and OPEN
        const session = await pbAdmin.collection('sessions').getOne(sessionId);
        if (session.status !== 'ABERTA') {
            throw new Error("Sessão inválida ou fechada");
        }

        // 2. Create Order record
        // In this refactored version, we can create an Order that contains the items directly or via relation.
        // To keep it simple and similar to before, let's create an Order record.
        const orderRecord = await pbAdmin.collection('orders').create({
            session: sessionId,
            status: 'Recebido'
        });

        // 3. Create Order Item
        const addonsPrice = (selectedAddons || []).reduce((acc, curr) => acc + curr.price, 0);
        const finalPrice = (item.price || 0) + addonsPrice;

        const orderItemData = {
            order: orderRecord.id,
            menu_item: item.id,
            quantity: 1,
            base_price: item.price,
            final_price: finalPrice,
            observations: observations,
            selected_addons: selectedAddons || [] // Store as JSON
        };

        const orderItemRecord = await pbAdmin.collection('order_items').create(orderItemData);

        res.status(201).json({ orderId: orderRecord.id });
    } catch (error) {
        console.error('Error in order:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/orders/:sessionId - Fetch all orders for a specific session
app.get('/api/orders/:sessionId', async (req, res) => {
    try {
        const pbAdmin = await getAdminPB();

        // Fetch orders for session and expand items
        const orders = await pbAdmin.collection('orders').getFullList({
            filter: `session = "${req.params.sessionId}"`,
            expand: 'order_items.menu_item',
            sort: '-created'
        });

        const result = orders.flatMap(o => {
            return (o.expand?.order_items || []).map(pi => ({
                id: o.id,
                status: o.status,
                timestamp: o.created,
                orderItemId: pi.id,
                quantity: pi.quantity,
                price: pi.base_price,
                finalPrice: pi.final_price,
                observations: pi.observations,
                name: pi.expand?.menu_item?.name || 'Item Removido',
                image: pi.expand?.menu_item?.image_url,
                selectedAddons: pi.selected_addons || []
            }));
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const pbAdmin = await getAdminPB();
        const updateData = { status };

        if (status === 'Preparando') {
            updateData.processing_at = new Date().toISOString();
        } else if (status === 'Pronto') {
            updateData.ready_at = new Date().toISOString();
        } else if (status === 'Entregue') {
            updateData.delivered_at = new Date().toISOString();
        }

        await pbAdmin.collection('orders').update(req.params.id, updateData);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ADMIN METRICS ---

app.get('/api/admin/metrics', async (req, res) => {
    const { period } = req.query; // '1d', '1w', '1m', '3m', '6m', '1y'

    try {
        const pbAdmin = await getAdminPB();

        // Calculate date limit
        const now = new Date();
        let dateLimit = new Date();
        if (period === '1d') dateLimit.setDate(now.getDate() - 1);
        else if (period === '1w') dateLimit.setDate(now.getDate() - 7);
        else if (period === '3m') dateLimit.setMonth(now.getMonth() - 3);
        else if (period === '6m') dateLimit.setMonth(now.getMonth() - 6);
        else if (period === '1y') dateLimit.setFullYear(now.getFullYear() - 1);
        else dateLimit.setMonth(now.getMonth() - 1); // Default 1m

        const filterDate = dateLimit.toISOString().replace('T', ' ');

        // 1. Financeiro: Receita e Pedidos
        const payments = await pbAdmin.collection('payments').getFullList({
            filter: `status = "CAPTURADO" && created >= "${filterDate}"`
        });
        const revenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
        const totalOrders = payments.length;

        // 2. Mesas
        const totalTables = await pbAdmin.collection('tables').getFullList({ filter: 'active = true' });
        const occupiedSessions = await pbAdmin.collection('sessions').getFullList({ filter: 'status = "ABERTA"' });

        // 3. Performance & Peak Hours (requires fetching orders)
        const orders = await pbAdmin.collection('orders').getFullList({
            filter: `created >= "${filterDate}"`
        });

        const performance = {
            avgProduction: 0,
            avgDelivery: 0
        };
        // Simple avg calc
        let prodSum = 0, delivSum = 0, prodCount = 0, delivCount = 0;
        orders.forEach(o => {
            if (o.processing_at && o.ready_at) {
                prodSum += (new Date(o.ready_at) - new Date(o.processing_at)) / 60000;
                prodCount++;
            }
            if (o.ready_at && o.delivered_at) {
                delivSum += (new Date(o.delivered_at) - new Date(o.ready_at)) / 60000;
                delivCount++;
            }
        });
        performance.avgProduction = prodCount > 0 ? (prodSum / prodCount).toFixed(1) : 0;
        performance.avgDelivery = delivCount > 0 ? (delivSum / delivCount).toFixed(1) : 0;

        // 4. Peak Hours
        const peakHoursMap = {};
        orders.forEach(o => {
            const hour = new Date(o.created).getHours();
            peakHoursMap[hour] = (peakHoursMap[hour] || 0) + 1;
        });
        const peakHours = Object.keys(peakHoursMap).map(h => ({ hour: `${h}h`, count: peakHoursMap[h] }));

        // 6. Evolução Diária
        const evolutionMap = {};
        payments.forEach(p => {
            const date = new Date(p.created).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            evolutionMap[date] = (evolutionMap[date] || 0) + p.amount;
        });
        const revenueEvolution = Object.keys(evolutionMap).map(d => ({ date: d, value: evolutionMap[d] }));

        const metrics = {
            revenue,
            totalOrders,
            tables: {
                total: totalTables.length,
                occupied: occupiedSessions.length,
                empty: Math.max(0, totalTables.length - occupiedSessions.length)
            },
            performance,
            peakHours,
            abandonment: 0, // Placeholder
            revenueEvolution
        };

        res.json(metrics);
    } catch (e) {
        console.error('Error fetching metrics:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- KITCHEN GLOBAL SYNC ---

// GET /api/admin/kitchen/orders — Busca TODOS os pedidos ativos
app.get('/api/admin/kitchen/orders', async (req, res) => {
    try {
        const pbAdmin = await getAdminPB();

        const activeOrders = await pbAdmin.collection('orders').getFullList({
            filter: 'status != "Entregue" && status != "Cancelado"',
            sort: 'created',
            expand: 'session.table,order_items.menu_item'
        });

        const result = activeOrders.flatMap(o => {
            return (o.expand?.order_items || []).map(pi => ({
                id: pi.id,
                orderId: o.id,
                status: o.status,
                timestamp: o.created,
                quantity: pi.quantity,
                valor_total: pi.final_price,
                observations: pi.observations,
                name: pi.expand?.menu_item?.name || 'Item Removido',
                tableIdentifier: o.expand?.session?.expand?.table?.identificador_mesa || 'N/A',
                tableId: o.expand?.session?.table,
                selectedAddons: pi.selected_addons || []
            }));
        });

        res.json(result);
    } catch (e) {
        console.error('Error in kitchen orders:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- STRIPE (Checkout Session) ---

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items, tip, appTax, sessionId, userId, total } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Nenhum item no pedido' });
        }

        const line_items = items.map(item => ({
            price_data: {
                currency: 'brl',
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        if (tip > 0) {
            line_items.push({
                price_data: {
                    currency: 'brl',
                    product_data: { name: 'Gorjeta Garçom' },
                    unit_amount: Math.round(tip * 100),
                },
                quantity: 1,
            });
        }

        if (appTax > 0) {
            line_items.push({
                price_data: {
                    currency: 'brl',
                    product_data: { name: 'Taxa do App (3%)' },
                    unit_amount: Math.round(appTax * 100),
                },
                quantity: 1,
            });
        }

        const totalAmount = total || items.reduce((acc, i) => acc + i.price * i.quantity, 0) + (tip || 0) + (appTax || 0);
        let successUrl = `${YOUR_DOMAIN}/success?type=direct&amount=${totalAmount.toFixed(2)}`;
        if (sessionId) successUrl += `&session_id=${sessionId}`;
        if (userId) successUrl += `&user_id=${userId}`;

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: successUrl,
            cancel_url: `${YOUR_DOMAIN}/bill?canceled=true`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/payment/direct/confirm — Confirma pagamento direto (Pagar Integral)
app.post('/api/payment/direct/confirm', async (req, res) => {
    const { sessionId, userId, amount } = req.body;

    if (!sessionId || !amount) {
        return res.status(400).json({ error: 'sessionId e amount são obrigatórios' });
    }

    try {
        const pbAdmin = await getAdminPB();

        // Verificar se a sessão está aberta
        const session = await pbAdmin.collection('sessions').getOne(sessionId);
        if (session.status !== 'ABERTA') {
            return res.status(400).json({ error: 'Sessão inválida ou fechada' });
        }

        // Criar registro do pagamento
        const paymentRecord = await pbAdmin.collection('payments').create({
            session: sessionId,
            amount: parseFloat(amount),
            status: 'CAPTURADO',
            method: 'STRIPE_DIRETO'
        });

        // Registrar a contribuição (100% do pagador)
        await pbAdmin.collection('payment_contributions').create({
            payment: paymentRecord.id,
            contributor_name: 'Pagamento Integral',
            amount: parseFloat(amount),
            status: 'PAGO',
            payer: userId || null
        });

        // Vincular TODOS os itens ativos da sessão ao pagamento
        const orders = await pbAdmin.collection('orders').getFullList({
            filter: `session = "${sessionId}" && status != "Cancelado"`,
            expand: 'order_items'
        });

        for (const order of orders) {
            for (const item of (order.expand?.order_items || [])) {
                await pbAdmin.collection('pool_items').create({
                    payment: paymentRecord.id,
                    order_item: item.id
                });
            }
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Error confirming direct payment:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- STRIPE POOL (Divisão) ---

// GET /api/pool/:id
app.get('/api/pool/:id', async (req, res) => {
    try {
        const pbAdmin = await getAdminPB();
        const payment = await pbAdmin.collection('payments').getOne(req.params.id);
        const contributions = await pbAdmin.collection('payment_contributions').getFullList({
            filter: `payment = "${req.params.id}"`,
            sort: '-created'
        });

        const mappedContributions = contributions.map(c => ({
            contributorName: c.contributor_name,
            amount: parseFloat(c.amount),
            status: c.status,
            timestamp: c.created
        }));

        const initialPaid = mappedContributions.reduce((acc, c) => acc + c.amount, 0);
        res.json({
            id: payment.id,
            totalAmount: parseFloat(payment.amount),
            initialPaid,
            remainingAmount: Math.max(0, parseFloat(payment.amount) - initialPaid),
            contributions: mappedContributions,
            isPaid: payment.status === 'CAPTURADO'
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/pool/session/:sessionId -> Busca pool PENDENTE ativa
app.get('/api/pool/session/:sessionId', async (req, res) => {
    try {
        const pbAdmin = await getAdminPB();
        const pools = await pbAdmin.collection('payments').getList(1, 1, {
            filter: `session = "${req.params.sessionId}" && status = "PENDENTE"`,
            sort: '-created'
        });

        if (pools.items.length === 0) return res.status(200).json({ pool: null });

        const pool = pools.items[0];
        const contributions = await pbAdmin.collection('payment_contributions').getFullList({
            filter: `payment = "${pool.id}"`,
            sort: '-created'
        });

        const poolItems = await pbAdmin.collection('pool_items').getFullList({
            filter: `payment = "${pool.id}"`,
            expand: 'order_item.menu_item'
        });

        const mappedContributions = contributions.map(c => ({
            contributorName: c.contributor_name,
            amount: parseFloat(c.amount),
            status: c.status,
            timestamp: c.created
        }));

        const paid = mappedContributions
            .filter(c => ['PAGO', 'AUTORIZADO', 'CAPTURADO'].includes(c.status))
            .reduce((acc, c) => acc + c.amount, 0);

        res.json({
            pool: {
                id: pool.id,
                totalAmount: parseFloat(pool.amount),
                paid,
                remainingAmount: Math.max(0, parseFloat(pool.amount) - paid),
                contributions: mappedContributions,
                items: poolItems.map(pi => ({
                    orderItemId: pi.order_item,
                    name: pi.expand?.order_item?.expand?.menu_item?.name || 'N/A',
                    finalPrice: pi.expand?.order_item?.final_price,
                    quantity: pi.expand?.order_item?.quantity
                })),
                isPaid: pool.status === 'CAPTURADO',
                status: pool.status
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/pool/create
app.post('/api/pool/create', async (req, res) => {
    const { totalAmount, sessionId, orderItemIds } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Sessão da mesa é obrigatória' });

    try {
        const pbAdmin = await getAdminPB();

        // 1. Check session
        const session = await pbAdmin.collection('sessions').getOne(sessionId);
        if (session.status !== 'ABERTA') return res.status(400).json({ error: 'Sessão inválida ou fechada' });

        // 2. Check for existing PENDENTE pool
        const existingPools = await pbAdmin.collection('payments').getList(1, 1, {
            filter: `session = "${sessionId}" && status = "PENDENTE"`,
            sort: '-created'
        });

        let poolRecord;
        if (existingPools.items.length > 0) {
            poolRecord = existingPools.items[0];
        } else {
            // Create new pool
            poolRecord = await pbAdmin.collection('payments').create({
                session: sessionId,
                amount: totalAmount,
                status: 'PENDENTE',
                method: 'STRIPE'
            });
        }

        // 3. Link items
        if (orderItemIds && orderItemIds.length > 0) {
            for (const itemId of orderItemIds) {
                // Check if already linked to avoid duplicates (unique constraint handled by logic or PB)
                await pbAdmin.collection('pool_items').create({
                    payment: poolRecord.id,
                    order_item: itemId
                });
            }
            // Recalculate total if needed (optional based on your requirement)
        }

        res.json({ pool: { id: poolRecord.id, totalAmount: poolRecord.amount } });
    } catch (e) {
        console.error('Error creating pool:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/pool/checkout
app.post('/api/pool/checkout', async (req, res) => {
    try {
        const { poolId, amount, contributorName, itemName, userId, type } = req.body;

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
            payment_intent_data: { capture_method: 'manual' },
            metadata: {
                poolId: poolId.toString(),
                contributorName,
                userId: userId ? userId.toString() : ''
            },
            success_url: `${YOUR_DOMAIN}/success?pool_id=${poolId}&amount=${amount}&name=${encodeURIComponent(contributorName)}${userId ? `&user_id=${userId}` : ''}${type ? `&type=${type}` : ''}`,
            cancel_url: `${YOUR_DOMAIN}/pool/${poolId}?canceled=true`,
        });

        res.json({ url: session.url });
    } catch (e) {
        console.error('Error pool checkout:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/pool/confirm
app.post('/api/pool/confirm', async (req, res) => {
    const { poolId, amount, contributorName, userId } = req.body;
    try {
        const pbAdmin = await getAdminPB();

        await pbAdmin.collection('payment_contributions').create({
            payment: poolId,
            contributor_name: contributorName,
            amount: parseFloat(amount),
            status: 'PAGO',
            payer: userId || null
        });

        // Check if pool is completed
        const pool = await pbAdmin.collection('payments').getOne(poolId);
        const contributions = await pbAdmin.collection('payment_contributions').getFullList({
            filter: `payment = "${poolId}" && status = "PAGO"`
        });
        const totalPaid = contributions.reduce((acc, c) => acc + c.amount, 0);

        if (totalPaid >= pool.amount) {
            await pbAdmin.collection('payments').update(poolId, { status: 'CAPTURADO' });
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Error confirming pool payment:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- WAITER PORTAL ---

// GET /api/waiter/tables - Listagem geral
app.get('/api/waiter/tables', async (req, res) => {
    try {
        const pbAdmin = await getAdminPB();
        const tables = await pbAdmin.collection('tables').getFullList({
            filter: 'active = true',
            expand: 'sessions(table)' // PocketBase back-relation syntax
        });

        const result = tables.map(t => {
            const activeSession = (t.expand?.['sessions(table)'] || []).find(s => s.status === 'ABERTA');
            return {
                mesa_id: t.id,
                identificador: t.identificador_mesa,
                capacidade: t.capacidade,
                sessao_id: activeSession?.id || null,
                status: activeSession ? 'ABERTA' : 'LIVRE',
                total_pedidos: 0, // Placeholder
                total_conta: 0 // Placeholder
            };
        });

        res.json(result);
    } catch (e) {
        console.error('Error fetching waiter tables:', e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/waiter/tables/:tableId - Detalhes
app.get('/api/waiter/tables/:tableId', async (req, res) => {
    try {
        const pbAdmin = await getAdminPB();
        const table = await pbAdmin.collection('tables').getOne(req.params.tableId);

        const sessions = await pbAdmin.collection('sessions').getList(1, 1, {
            filter: `table = "${req.params.tableId}" && status = "ABERTA"`,
            sort: '-created'
        });

        if (sessions.items.length === 0) {
            return res.json({ identificador: table.identificador_mesa, status: 'LIVRE', pedidos: [], total_pendente: 0 });
        }

        const session = sessions.items[0];

        // Fetch orders and items
        const orders = await pbAdmin.collection('orders').getFullList({
            filter: `session = "${session.id}" && status != "Cancelado"`,
            expand: 'order_items.menu_item'
        });

        const mappedOrders = orders.flatMap(o => (o.expand?.order_items || []).map(pi => ({
            id_pedido_item: pi.id,
            quantidade: pi.quantity,
            valor_total: pi.final_price,
            status: o.status,
            nome_item: pi.expand?.menu_item?.name || 'N/A',
            is_paid: false // Needs check against pool_items
        })));

        res.json({
            identificador: table.identificador_mesa,
            status: 'ABERTA',
            sessao_id: session.id,
            pedidos: mappedOrders,
            total_itens: mappedOrders.reduce((acc, curr) => acc + curr.valor_total, 0),
            pool: null
        });
    } catch (e) {
        console.error('Error fetching table details:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/waiter/tables/:tableId/close
app.post('/api/waiter/tables/:tableId/close', async (req, res) => {
    try {
        const pbAdmin = await getAdminPB();
        const sessions = await pbAdmin.collection('sessions').getList(1, 1, {
            filter: `table = "${req.params.tableId}" && status = "ABERTA"`
        });
        if (sessions.items.length > 0) {
            await pbAdmin.collection('sessions').update(sessions.items[0].id, { status: 'FECHADA' });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/waiter/tables/:tableId/open
app.post('/api/waiter/tables/:tableId/open', async (req, res) => {
    const { tableId } = req.params;
    const { userId } = req.body;
    try {
        const pbAdmin = await getAdminPB();
        const check = await pbAdmin.collection('sessions').getList(1, 1, {
            filter: `table = "${tableId}" && status = "ABERTA"`
        });
        if (check.items.length > 0) return res.status(400).json({ error: 'Mesa já possui uma sessão aberta' });

        const result = await pbAdmin.collection('sessions').create({
            restaurant: '1',
            table: tableId,
            creator: userId || 'waiter',
            status: 'ABERTA'
        });

        res.json({ success: true, sessionId: result.id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- INTERVALS (Cron Jobs) ---

// Auto-cancel delayed orders
setInterval(async () => {
    try {
        const pbAdmin = await getAdminPB();
        const limitDate = new Date(Date.now() - 30 * 60 * 1000).toISOString().replace('T', ' ');
        const delayedOrders = await pbAdmin.collection('orders').getFullList({
            filter: `status = "Recebido" && created < "${limitDate}"`
        });

        for (const order of delayedOrders) {
            await pbAdmin.collection('orders').update(order.id, { status: 'Cancelado' });
            console.log(`[Auto-Cancel] Pedido ${order.id} cancelado.`);
        }
    } catch (e) {
        console.error('Error on auto-cancel orders:', e);
    }
}, 60 * 1000);

const PORT = process.env.PORT || 4242;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
