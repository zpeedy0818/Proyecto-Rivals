export const sheetsService = {
    fetchData: async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch from Sheets');
            return await response.json();
        } catch (error) {
            console.error('Sheets Fetch Error:', error);
            throw error;
        }
    },

    upsertAccount: async (url, account) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                mode: 'no-cors', // Apps Script requires no-cors sometimes or handles it differently
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'upsert',
                    data: account
                })
            });
            return { status: 'requested' }; // Mode no-cors doesn't allow reading response
        } catch (error) {
            console.error('Sheets Upsert Error:', error);
            throw error;
        }
    },

    deleteAccount: async (url, id) => {
        try {
            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    id: id
                })
            });
            return { status: 'requested' };
        } catch (error) {
            console.error('Sheets Delete Error:', error);
            throw error;
        }
    }
};
