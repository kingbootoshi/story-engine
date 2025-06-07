import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Stub Supabase client – extremely light in-memory implementation that
// supports just enough of the query-builder API surface required by
// SupabaseWorldRepo.  We purposefully scope this stub to the test file to
// avoid accidental production usage.
// ---------------------------------------------------------------------------

// Small helper to deep-clone simple JSON objects (no Dates / functions).
const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// In-memory table storage
interface RowMap { [table: string]: any[] }
const tables: RowMap = {
  world_arcs: [],
  world_beats: [],
};

// Factory that returns a very small subset of the PostgREST query builder
// interface.  Most methods immediately mutate the in-memory state and resolve
// to a Supabase-like response object ({ data, error }).
function builder(table: string) {
  let rows = tables[table];
  let selection: string | undefined;
  let filters: [string, any][] = [];
  let orderBy: { column: string; ascending: boolean } | null = null;
  let limitN: number | null = null;

  const applyFilters = (dataset: any[]): any[] => {
    let out = dataset;
    filters.forEach(([col, val]) => {
      out = out.filter(r => r[col] === val);
    });
    if (orderBy) {
      const { column, ascending } = orderBy;
      out = [...out].sort((a, b) => {
        if (a[column] === b[column]) return 0;
        return ascending ? a[column] - b[column] : b[column] - a[column];
      });
    }
    if (typeof limitN === 'number') {
      out = out.slice(0, limitN);
    }
    return out;
  };

  const api: any = {
    // INSERT ---------------------------------------------------------------
    insert(payload: any) {
      const rowArray = Array.isArray(payload) ? payload : [payload];
      const inserted = rowArray.map((p: any) => {
        const row = { id: randomUUID(), ...clone(p) };
        rows.push(row);
        return row;
      });
      rows = tables[table]; // refresh reference
      // Chainable pattern – return the same builder with lastInsert captured
      api._lastInsert = inserted[0];
      return api;
    },

    // UPDATE ---------------------------------------------------------------
    update(values: any) {
      api._pendingUpdate = values;
      return api;
    },

    // SELECT ---------------------------------------------------------------
    select(_cols?: string) {
      selection = _cols;
      return api;
    },

    // FILTER ---------------------------------------------------------------
    eq(column: string, value: any) {
      if (api._pendingUpdate) {
        // Perform update now that we know target rows
        rows
          .filter(r => r[column] === value)
          .forEach(r => Object.assign(r, api._pendingUpdate));
        api._pendingUpdate = undefined;
        return Promise.resolve({ data: null, error: null });
      }
      filters.push([column, value]);
      return api;
    },

    // ORDER & LIMIT --------------------------------------------------------
    order(column: string, opts: { ascending: boolean }) {
      orderBy = { column, ascending: opts.ascending };
      return api;
    },
    limit(n: number) {
      limitN = n;
      return api;
    },

    // RESULT TERMINATORS ---------------------------------------------------
    single() {
      const dataset = api._lastInsert ? [api._lastInsert] : applyFilters(rows);
      const first = dataset[0];
      if (!first) {
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      }
      return Promise.resolve({ data: selection ? first : first, error: null });
    },
  };
  return api;
}

// Stub builder hookup – we monkey-patch the real Supabase client *after* it is
// imported because the repo holds a direct reference to the exported instance.
// ---------------------------------------------------------------------------
import { supabase as realSupabase } from '../../src/core/infra/supabase';

// Replace the networked `.from()` method with our in-memory version.
// eslint-disable-next-line functional/immutable-data
(realSupabase as any).from = (tableName: string) => builder(tableName);

// ---------------------------------------------------------------------------
// Now we can import the repository – it will pick up the patched client.
// ---------------------------------------------------------------------------
import { SupabaseWorldRepo } from '../../src/modules/world/infra/persistence/SupabaseWorldRepo';

// ---------------------------------------------------------------------------
// Helper to make dummy beat data
// ---------------------------------------------------------------------------
const makeBeatData = (idx: number) => ({
  beat_name: `Beat ${idx}`,
  description: `Desc ${idx}`,
  world_directives: [],
  emergent_storylines: [],
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SupabaseWorldRepo.createBeat – current_beat_id behaviour', () => {
  it('keeps pointer at beat 0 after inserting anchors 7 and 14', async () => {
    const repo = new SupabaseWorldRepo();

    const worldId = randomUUID(); // the repo never validates existence in stub
    const arc = await repo.createArc(worldId, 'Test Arc', 'Idea');

    // Insert three anchor beats
    const beat0 = await repo.createBeat(arc.id, 0, 'anchor', makeBeatData(0));
    await repo.createBeat(arc.id, 7, 'anchor', makeBeatData(7));
    await repo.createBeat(arc.id, 14, 'anchor', makeBeatData(14));

    // Reload arc to inspect pointer
    const reloaded = await repo.getArc(arc.id);
    expect(reloaded?.current_beat_id).toBe(beat0.id);
  });
}); 