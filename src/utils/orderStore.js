import ky from 'ky';

const API_URL = 'http://localhost:4242/api';

const api = ky.create({
    prefixUrl: API_URL,
    retry: 0
});

// --- Orders Logic ---
export const getOrders = async () => {
    try {
        const orders = await api.get('orders').json();
        return orders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
};

export const addToOrder = async (item, selectedAddons = [], observations = '') => {
    try {
        await api.post('orders', {
            json: { item, selectedAddons, observations }
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
    // With a real DB, this might clear a session or do nothing on client side
    // For now, we'll keep it as a no-op or clear local state if we had any
};

// --- Pools Logic (Keep as localStorage for now or migrate if needed) ---
// Since the user focused on "dados oriundos do banco", I'll keep pools in localStorage 
// unless I see a clear table for them in bd.sql that I should use.
// bd.sql has pagamentos_divisoes which is for pools. 

export const getPools = () => {
    const saved = localStorage.getItem('restaurant_pools_v1');
    return saved ? JSON.parse(saved) : {};
};

export const savePools = (pools) => {
    localStorage.setItem('restaurant_pools_v1', JSON.stringify(pools));
};

export const createPool = (totalAmount, baseAmount) => {
    const pools = getPools();
    const poolId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const newPool = {
        id: poolId,
        totalAmount,
        initialPaid: baseAmount,
        remainingAmount: totalAmount - baseAmount,
        contributions: [],
        createdAt: new Date().toISOString(),
        isPaid: false
    };
    pools[poolId] = newPool;
    savePools(pools);
    return newPool;
};

export const getPool = (poolId) => {
    return getPools()[poolId];
};

export const addContribution = (poolId, amount, contributorName) => {
    const pools = getPools();
    if (pools[poolId]) {
        pools[poolId].contributions.push({ amount, contributorName, timestamp: new Date().toISOString() });
        pools[poolId].remainingAmount -= amount;
        if (pools[poolId].remainingAmount <= 0.01) {
            pools[poolId].isPaid = true;
            pools[poolId].remainingAmount = 0;
        }
        savePools(pools);
    }
    return pools[poolId];
};
