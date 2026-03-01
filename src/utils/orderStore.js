import ky from 'ky';

const API_URL = 'http://localhost:4242/api';

const api = ky.create({
    prefixUrl: API_URL,
    retry: 0
});

// --- Orders Logic ---
export const getOrders = async (sessionId) => {
    if (!sessionId) return [];
    try {
        const orders = await api.get(`orders/${sessionId}`).json();
        return orders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
};

export const addToOrder = async (item, selectedAddons = [], observations = '', sessionId) => {
    if (!sessionId) throw new Error("Mesa não identificada");
    try {
        await api.post('orders', {
            json: { item, selectedAddons, observations, sessionId }
        }).json();
    } catch (error) {
        console.error('Error adding to order:', error);
        throw error;
    }
};

export const updateOrderStatus = async (orderId, newStatus) => {
    try {
        await api.patch(`orders/${orderId}/status`, {
            json: { status: newStatus }
        }).json();
    } catch (error) {
        console.error('Error updating order status:', error);
    }
};

export const clearOrders = () => {
};
// --- Pools Logic ---

export const getPools = () => {
    return {};
};

export const createPool = async (totalAmount, baseAmount, sessionId) => {
    if (!sessionId) throw new Error("Mesa não identificada");
    try {
        const response = await api.post('pool/create', { json: { totalAmount, baseAmount, sessionId } }).json();
        return response.pool;
    } catch (error) {
        console.error('Error creating pool:', error);
        throw error;
    }
};

export const getPool = async (poolId) => {
    try {
        const response = await api.get(`pool/${poolId}`).json();
        return response;
    } catch (error) {
        console.error('Error fetching pool:', error);
        return null;
    }
};

export const getPoolBySession = async (sessionId) => {
    try {
        const response = await api.get(`pool/session/${sessionId}`).json();
        return response.pool;
    } catch (error) {
        console.error('Error fetching pool for session:', error);
        return null;
    }
};

export const addContribution = async () => {
    // Replaced by calling Stripe Checkout directly in Pool.jsx
    throw new Error("Use call to /api/pool/checkout directly in the component");
};
