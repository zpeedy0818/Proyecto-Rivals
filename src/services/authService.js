import { supabaseService } from './supabaseService'

export const authService = {
    /**
     * Register a new user with email and password.
     */
    signUp: async (email, password) => {
        const { data, error } = await supabaseService.client().auth.signUp({ email, password })
        if (error) throw error
        return data
    },

    /**
     * Log in an existing user.
     */
    signIn: async (email, password) => {
        const { data, error } = await supabaseService.client().auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
    },

    /**
     * Log out the current user.
     */
    signOut: async () => {
        const { error } = await supabaseService.client().auth.signOut()
        if (error) throw error
    },

    /**
     * Returns the current active session (or null if not logged in).
     */
    getSession: async () => {
        const { data } = await supabaseService.client().auth.getSession()
        return data.session
    },

    /**
     * Fetches the user's saved settings from the DB.
     */
    getUserSettings: async (userId) => {
        const { data, error } = await supabaseService.client()
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single()
        if (error && error.code !== 'PGRST116') throw error
        return data
    },

    /**
     * Saves the user's settings (API keys etc.) to the DB.
     */
    saveUserSettings: async (userId, settings) => {
        const { error } = await supabaseService.client()
            .from('user_settings')
            .upsert({
                user_id: userId,
                sheets_url: settings.sheetsUrl || '',
                rivals_key: settings.rivalsKey || '',
                eldorado_key: settings.eldoradoKey || ''
            })
        if (error) throw error
    }
}
