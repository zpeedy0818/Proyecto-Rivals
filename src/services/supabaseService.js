import { createClient } from '@supabase/supabase-js'

let supabase = null

export const supabaseService = {
    /**
     * Initializes the Supabase client.
     * @param {string} url - Supabase project URL.
     * @param {string} key - Supabase anon/public key.
     */
    init: (url, key) => {
        if (url && key) {
            supabase = createClient(url, key)
        }
    },

    /**
     * Returns the raw Supabase client instance.
     */
    client: () => supabase,

    /**
     * Fetches accounts belonging to the current user.
     */
    getAccounts: async (userId) => {
        if (!supabase) return []
        let query = supabase.from('accounts').select('*').order('id', { ascending: true })
        if (userId) query = query.eq('user_id', userId)
        const { data, error } = await query

        if (error) {
            console.error('Supabase Error:', error)
            throw error
        }
        return data
    },

    /**
     * Upserts an account, always stamping the user_id.
     */
    upsertAccount: async (account, userId) => {
        if (!supabase) return
        const payload = userId ? { ...account, user_id: userId } : account
        const { data, error } = await supabase
            .from('accounts')
            .upsert(payload)
            .select()

        if (error) {
            console.error('Supabase Error:', error)
            throw error
        }
        return data
    },

    /**
     * Deletes an account by ID.
     * @param {string} id - The account ID.
     */
    deleteAccount: async (id) => {
        if (!supabase) return
        const { error } = await supabase
            .from('accounts')
            .delete()
            .match({ id })

        if (error) {
            console.error('Supabase Error:', error)
            throw error
        }
    }
}
