export const eldoradoService = {
    checkOrders: async (apiKey) => {
        if (!apiKey) return null;
        try {
            // Base URL from research: eldorado.gg/api
            // Note: In a real environment, this might need a proxy to avoid CORS
            const response = await fetch('https://www.eldorado.gg/api/v1/seller/orders', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Eldorado API error');
            return await response.json();
        } catch (error) {
            console.error('Eldorado Sync Error:', error);
            throw error;
        }
    }
};
