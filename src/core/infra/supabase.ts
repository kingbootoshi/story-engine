import { createClient } from '@supabase/supabase-js';
import { createLogger } from './logger';
import { env } from '../../shared/config/env';

const logger = createLogger('supabase');

const isBrowser = typeof window !== 'undefined';

const supabaseUrl: string | undefined = isBrowser
  ? (import.meta as any).env.VITE_SUPABASE_URL
  : env.SUPABASE_URL;

/**
 * Resolve the most privileged Supabase key available **for server-side usage**.
 *
 * Priority order (server only):
 * 1. `SUPABASE_SERVICE_ROLE_KEY` – bypasses RLS, suitable for trusted backend only
 * 2. `SUPABASE_ANON_KEY`        – falls back to anon role when service key absent
 *
 * For browser builds we **always** use the vite-exposed anon key because shipping the
 * service role key to the client would defeat the whole purpose of RLS.
 */
const supabaseKey: string | undefined = isBrowser
  ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY
  : env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  logger.error('[Supabase] Missing credentials – make sure the appropriate ' +
                'environment variables are set in your .env and/or Vite config');
}

// ---------------------------------------------------------------------------
// Supabase client – server gets service key (if available), browser gets anon.
// IMPORTANT: Do **NOT** log the key value; we only log which role is in use.
// ---------------------------------------------------------------------------

const roleInUse = isBrowser ? 'anon (browser)' : (env.SUPABASE_SERVICE_ROLE_KEY ? 'service' : 'anon');

logger.debug(`[Supabase] Initialising client with ${roleInUse} key`);

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');