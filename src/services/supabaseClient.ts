import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-supabase')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export interface SupabaseConfigStatus {
  configured: boolean;
  url: string;
  message: string;
}

export function getSupabaseStatus(): SupabaseConfigStatus {
  if (isSupabaseConfigured) {
    return {
      configured: true,
      url: supabaseUrl,
      message: 'Connected to live Supabase backend instance.',
    };
  }
  return {
    configured: false,
    url: 'Not configured (using local demonstration store)',
    message: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect live database.',
  };
}

