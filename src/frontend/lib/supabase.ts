import { createClient } from '@supabase/supabase-js';
import { createLogger } from '../../shared/utils/loggerBrowser';
import type { Database } from '../../modules/world/backend/schema';

const logger = createLogger('supabase-browser');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing required Supabase environment variables');
  throw new Error('Supabase configuration is incomplete');
}

logger.info('Initializing Supabase client for browser', {
  url: supabaseUrl,
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type { Database };