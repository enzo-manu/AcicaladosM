import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';

const env = (typeof import.meta !== 'undefined' && import.meta && (import.meta as any).env) || {};
const procEnv = (typeof process !== 'undefined' && process.env) || {};

const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  procEnv.VITE_SUPABASE_URL ||
  procEnv.NEXT_PUBLIC_SUPABASE_URL ||
  'https://ydvqzgyhymjgbyfkxqhd.supabase.co';

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  procEnv.VITE_SUPABASE_ANON_KEY ||
  procEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkdnF6Z3loeW1qZ2J5Zmt4cWhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NTczNDYsImV4cCI6MjEwNDQzMzM0Nn0.7jGqXpA1Cq6yFgFHtpQTkm-sMOC5c5juUZQLWVWzMgU';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export default supabase;
