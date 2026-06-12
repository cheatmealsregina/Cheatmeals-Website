import { createClient } from '@supabase/supabase-js';

/* Singleton Supabase client for the public site.
   Uses the anon (publishable) key ONLY — Row Level Security on the
   database enforces what it can do. The service-role key must never
   appear in this app or any client-side code. */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local and fill in your Supabase project values.'
  );
}

export const supabase = createClient(url, anonKey);
