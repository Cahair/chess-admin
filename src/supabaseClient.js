import { createClient } from '@supabase/supabase-js';

// On récupère les clés du .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// On crée le client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);