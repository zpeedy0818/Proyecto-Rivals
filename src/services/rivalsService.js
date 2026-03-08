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

            // The API response can be nested under 'player' or be directly in the root
            const p = data.player || data;

            // Try multiple common field names for level and ensure it's a number
            // Often community APIs track 'level' as a string or have 'account_level'
            const rawLevel = p.level || p.account_level || (p.rank && p.rank.season_max_level) || 0;
            const parsedLevel = parseInt(rawLevel, 10);

            return {
                level: isNaN(parsedLevel) || parsedLevel <= 0 ? 1 : parsedLevel,
                stats: {
                    winRate: p.stats?.win_rate || p.win_rate || '0%',
                    matches: p.stats?.matches || p.matches || 0,
                    kda: p.stats?.kda || p.kda || '0.0'
                }
            };
        } catch (error) {
            console.error('Rivals API Error:', error);
            throw error;
        }
    }
};
