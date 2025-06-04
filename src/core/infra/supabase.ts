import { createClient } from '@supabase/supabase-js';
import { createLogger } from './logger';

const logger = createLogger('supabase');

const isBrowser = typeof window !== 'undefined';

const supabaseUrl: string | undefined = isBrowser
  ? (import.meta as any).env.VITE_SUPABASE_URL
  : process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

const supabaseAnonKey: string | undefined = isBrowser
  ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY
  : process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('[Supabase] Missing credentials – make sure the appropriate ' +
                'environment variables are set in your .env and/or Vite config');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');