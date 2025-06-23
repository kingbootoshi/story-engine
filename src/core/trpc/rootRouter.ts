import { router } from './init';
import { worldRouter } from '../../modules/world/delivery/trpc/router';
import { locationRouter } from '../../modules/location/delivery/trpc/router';
import { factionRouter } from '../../modules/faction/delivery/trpc/router';
import { characterRouter } from '../../modules/character/delivery/trpc/router';

/**
 * Application-wide tRPC router.
 *
 * This file collects every module-level router into a single tree so that the
 * Express tRPC middleware can mount a single endpoint (`/api/trpc`) capable of
 * batch-dispatching to all procedures.
 *
 * Add new routers here as additional modules land; keep the structure flat to
 * avoid deep nesting for callers (`{ moduleName.procedure }`).
 */
export const appRouter = router({
  // ────────────────────────────────────────────────────────────────────────────
  // Module routers
  // Extend this object with `{ newModule: newModuleRouter }` as you add more
  // vertical slices to `src/modules`.
  world: worldRouter,
  location: locationRouter,
  faction: factionRouter,
  character: characterRouter,
});

/**
 * Inferred type helper used by the frontend tRPC client.  Importing `AppRouter`
 * allows type-safe calls without duplicating procedure signatures.
 */
export type AppRouter = typeof appRouter; 