import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePubKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabasePubKey) {
    console.warn('Supabase credentials missing. Cloud sync will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabasePubKey,
    {
        auth: {
            storageKey: 'habitatalpha-auth-session-v1', // This keeps it separate from everything else
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);