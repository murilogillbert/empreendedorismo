export const TABLE_KEY = 'restaurant_table_session_v1';

export const getTableSession = () => {
    const saved = localStorage.getItem(TABLE_KEY);
    return saved ? JSON.parse(saved) : null;
};

export const saveTableSession = (sessionData) => {
    localStorage.setItem(TABLE_KEY, JSON.stringify(sessionData));
};

export const clearTableSession = () => {
    localStorage.removeItem(TABLE_KEY);
};

export const joinTable = async (tableCode) => {
    try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4242';
        const response = await fetch(`${API_URL}/api/session/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tableCode })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao entrar na mesa');
        }

        saveTableSession({
            sessionId: data.sessionId,
            tableId: data.tableId,
            tableCode: data.tableCode,
            joinedAt: new Date().toISOString()
        });

        return data;
    } catch (error) {
        throw error;
    }
};
