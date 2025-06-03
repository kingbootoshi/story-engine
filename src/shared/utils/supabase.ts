import { createClient } from '@supabase/supabase-js';
import type { World } from '../types/world.types';
import type { WorldBeat } from '../types/beat.types';

// ---------------------------------------------------------------------------
// Supabase Credential Resolution
// ---------------------------------------------------------------------------

// Helper to detect if we're running in a browser-like environment.  Vite sets
// `window` during client-side execution, while it is undefined when running
// under Node (e.g. the server or tests).
const isBrowser = typeof window !== 'undefined';

// Front-end builds use the Vite-exposed environment variables that are
// statically injected at compile-time (prefixed with `VITE_`).  Back-end code
// falls back to plain `process.env` so we can reuse the same utility on both
// sides without duplicating logic.
const supabaseUrl: string | undefined = isBrowser
  ? (import.meta as any).env.VITE_SUPABASE_URL
  : process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

const supabaseAnonKey: string | undefined = isBrowser
  ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY
  : process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error('[Supabase] Missing credentials – make sure the appropriate ' +
                'environment variables are set in your .env and/or Vite config');
}

// Supabase client is a singleton across the app.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Lightweight logger that defers to our full Winston-based logger when we're
// running server-side, but degrades gracefully to `console` in the browser so
// we don't drag heavy Node-only dependencies (and their reliance on `process`)
// into the client bundle.

type LogMethods = 'info' | 'debug' | 'warn' | 'error' | 'success';

// Simple shim — every method just forwards to console with a tag
const browserLogger = /*#__PURE__*/ (() => {
  const tag = '[supabase]';
  const handler = (level: LogMethods) => (...args: any[]) => {
    // eslint-disable-next-line no-console
    (console as any)[level === 'success' ? 'info' : level](tag, ...args);
  };
  return {
    info: handler('info'),
    debug: handler('debug'),
    warn: handler('warn'),
    error: handler('error'),
    success: handler('success'),
  } as const;
})();

// Conditionally load the heavy logger only on the server.
let log: typeof browserLogger;
if (typeof window === 'undefined') {
  try {
    // Use runtime require via eval to avoid static bundler analysis.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-var-requires
    const { createLogger } = (eval('require') as NodeRequire)('./logger');
    log = createLogger(__filename);
  } catch {
    // Silent fallback; will use browserLogger
  }
} else {
  log = browserLogger;
}

// Typed table shortcuts (helps with intellisense) -----------------------------
export const db = {
  // Use non-generic `from` calls to avoid mismatched type arguments while
  // keeping the API surface small and readable. We still get typed responses
  // from the subsequent `select().single()` calls because we cast later.
  worlds: () => supabase.from('worlds'),
  arcs: () => supabase.from('world_arcs'),
  beats: () => supabase.from('world_beats'),
  // Future-proofing: add additional tables below as needed
};

// Thin repository-style helpers ----------------------------------------------
export async function createWorld(name: string, description: string): Promise<World> {
  log.info('DB create world', { name });
  const { data, error } = await db.worlds()
    // Supabase type generator isn't available here, so we cast to `any` to bypass
    // the strict `Insert<T>` requirement.  This keeps compile-time friction low
    // until we adopt a full Database schema type.
    .insert({ name, description } as any)
    .select()
    .single();
  if (error) throw error;
  log.success('World created', { id: data.id });
  return data;
}

export async function getWorld(id: string): Promise<World | null> {
  const { data, error } = await db.worlds().select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function getArcBeats(arcId: string): Promise<WorldBeat[]> {
  const { data, error } = await db.beats()
    .select('*')
    .eq('arc_id', arcId)
    .order('beat_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ... (other helpers can be progressively migrated) 