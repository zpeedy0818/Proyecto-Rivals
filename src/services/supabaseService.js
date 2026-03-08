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
     * Fetches all accounts from the 'accounts' table.
     */
    getAccounts: async () => {
        if (!supabase) return []
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .order('id', { ascending: true })

        if (error) {
            console.error('Supabase Error:', error)
            throw error
        }
        return data
    },

    /**
     * Upserts an account into the 'accounts' table.
     * @param {Object} account - The account data to save.
     */
    upsertAccount: async (account) => {
        if (!supabase) return
        const { data, error } = await supabase
            .from('accounts')
            .upsert(account)
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
