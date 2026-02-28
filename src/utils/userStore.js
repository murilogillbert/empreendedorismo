const USER_KEY = 'restaurant_user_v1';
const HISTORY_KEY = 'restaurant_history_v1';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4242';

export const getCurrentUser = () => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
};

export const saveUser = (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = () => {
    return localStorage.getItem('restaurant_token_v1');
};

export const saveAuthData = (user, token) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (token) {
        localStorage.setItem('restaurant_token_v1', token);
    }
};

export const logoutUser = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('restaurant_token_v1');
};

export const registerUser = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao criar conta');
        }

        saveAuthData(data.user, data.token);
        return data.user;
    } catch (error) {
        throw error;
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao fazer login');
        }

        saveAuthData(data.user, data.token);
        return data.user;
    } catch (error) {
        throw error;
    }
};

export const getOrderHistory = () => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [
        {
            id: 'ORD-7721',
            date: '2024-02-20',
            total: 85.50,
            status: 'Finalizado',
            items: ['Burger Classic', 'Suco de Laranja']
        },
        {
            id: 'ORD-5542',
            date: '2024-02-15',
            total: 42.00,
            status: 'Finalizado',
            items: ['Salada Caesar']
        }
    ];
};

export const addToHistory = (order) => {
    const history = getOrderHistory();
    history.unshift({
        ...order,
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Finalizado'
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};
