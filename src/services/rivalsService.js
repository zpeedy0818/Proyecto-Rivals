export const rivalsService = {
    /**
     * Fetches player statistics from the unofficial Marvel Rivals API.
     * @param {string} username - The player's in-game name.
     * @param {string} apiKey - Optional API key for MarvelRivalsAPI.com.
     * @returns {Promise<Object>} - Player data including level and basic stats.
     */
    fetchPlayerStats: async (username, apiKey = '') => {
        if (!username) return null;

        try {
            const headers = {
                'Accept': 'application/json'
            };

            if (apiKey) {
                headers['x-api-key'] = apiKey;
            }

            // Using the unoffical API endpoint
            const response = await fetch(`https://marvelrivalsapi.com/api/v1/find-player/${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: headers
            });

            if (response.status === 401 || response.status === 403) {
                throw new Error('API Key inválida o requerida por la API externa');
            }

            if (!response.ok) {
                throw new Error('No se pudo encontrar el jugador o la API está saturada');
            }

            const data = await response.json();

            // Basic normalization based on the common response structure for community APIs
            return {
                level: data.player?.level || data.level || 1,
                stats: {
                    winRate: data.player?.stats?.win_rate || data.win_rate || '0%',
                    matches: data.player?.stats?.matches || data.matches || 0,
                    kda: data.player?.stats?.kda || data.kda || '0.0'
                }
            };
        } catch (error) {
            console.error('Rivals API Error:', error);
            throw error;
        }
    }
};
