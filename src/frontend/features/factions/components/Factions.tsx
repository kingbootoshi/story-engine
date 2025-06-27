import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { trpc } from '@/shared/lib/trpcClient';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/shared/lib/trpcClient';

/**
 * tRPC‐derived helper types so the component stays fully type-safe.
 */
type RouterOutputs = inferRouterOutputs<AppRouter>;
/** A single faction returned by `faction.list`. */
type Faction = RouterOutputs['faction']['list'][number];
/** A historical event entry returned by `faction.getHistory`. */
type HistoricalEvent = RouterOutputs['faction']['getHistory'][number];

/**
 * Factions management view – lists all factions of the selected world, lets the
 * user inspect details (ideology, status, tags…) and quickly spawn a new
 * faction using the AI-assisted backend default.
 */
export function Factions() {
  /* ────────────────────────────────────────────────────────────────────────────
   * Routing helpers & basic state buckets
   * -------------------------------------------------------------------------*/
  const { worldId } = useParams<{ worldId: string }>();
  const [factions, setFactions] = useState<Faction[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [history, setHistory] = useState<HistoricalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  /* Form state for the very lightweight "create faction" dialog.  The backend
   * will enrich most fields via AI so we only ask for the *name* up-front. */
  const [newFactionName, setNewFactionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  /* ────────────────────────────────────────────────────────────────────────────
   * Data fetching helpers
   * -------------------------------------------------------------------------*/
  useEffect(() => {
    if (worldId) {
      fetchFactions();
    }
  }, [worldId]);

  /** Loads every faction that belongs to the active world. */
  const fetchFactions = async () => {
    if (!worldId) return;
    try {
      const data = await trpc.faction.list.query({ worldId });
      setFactions(data);
    } catch (err) {
      console.error('[Factions] Failed to fetch:', err);
      setError('Failed to load factions');
    } finally {
      setIsLoading(false);
    }
  };

  /** Retrieves the last 20 historical entries of a faction for sidebar view. */
  const fetchHistory = async (factionId: string) => {
    try {
      const events = await trpc.faction.getHistory.query({ id: factionId, limit: 20 });
      setHistory(events);
    } catch (err) {
      console.error('[Factions] Failed to fetch history:', err);
    }
  };

  /** Handles row-click in the list – selects faction & loads history. */
  const handleSelectFaction = (faction: Faction) => {
    setSelectedFaction(faction);
    fetchHistory(faction.id).catch(() => {/* handled above */});
  };

  /* ────────────────────────────────────────────────────────────────────────────
   * Mutations
   * -------------------------------------------------------------------------*/
  const handleCreateFaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worldId) return;
    setIsCreating(true);

    try {
      /**
       * The CreateFaction schema expects quite a few fields.  We supply sensible
       * placeholders; the server-side `FactionService` will then merge them with
       * AI-generated values so authors don't have to fill every property here.
       */
      const created = await trpc.faction.create.mutate({
        world_id: worldId,
        name: newFactionName.trim() || 'Unnamed Faction',
        ideology: 'To be determined',
        status: 'rising',
        members_estimate: 100,
        tags: [],
        banner_color: null,
        emblem_svg: null,
        home_location_id: null,
        controlled_locations: []
      });

      setFactions(prev => [...prev, created]);
      setShowCreateForm(false);
      setNewFactionName('');
    } catch (err) {
      console.error('[Factions] Failed to create faction:', err);
      setError('Failed to create faction');
    } finally {
      setIsCreating(false);
    }
  };

  /* ────────────────────────────────────────────────────────────────────────────
   * Render helpers – simple colour maps to visually distinguish status.
   * -------------------------------------------------------------------------*/
  const statusColours: Record<string, string> = {
    rising: '#4CAF50',
    stable: '#2196F3',
    declining: '#FF9800',
    collapsed: '#9E9E9E'
  };

  /* ────────────────────────────────────────────────────────────────────────────
   * JSX
   * -------------------------------------------------------------------------*/
  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading factions…</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ──────────────────────────────────────────────────────────────────
          Header
          ─────────────────────────────────────────────────────────────*/}
      <header style={{ marginBottom: '2rem' }}>
        <Link to={`/app/worlds/${worldId}`} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
          ← Back to World
        </Link>
        <h1>Factions</h1>
        <p style={{ color: '#666' }}>Political & ideological groups shaping this world</p>
      </header>

      {/* Error banner */}
      {error && (
        <div style={{ backgroundColor: '#ffebee', padding: '1rem', marginBottom: '1rem', border: '1px solid #ef5350', borderRadius: '4px', color: '#c62828' }}>
          {error}
        </div>
      )}

      {/* Create faction call-to-action */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {showCreateForm ? 'Cancel' : 'Create New Faction'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateFaction} style={{ marginBottom: '2rem', backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd', maxWidth: '600px' }}>
          <h3 style={{ marginTop: 0 }}>Create Faction</h3>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name *</label>
          <input
            type="text"
            value={newFactionName}
            onChange={e => setNewFactionName(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button
            type="submit"
            disabled={isCreating}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: isCreating ? 'not-allowed' : 'pointer', opacity: isCreating ? 0.6 : 1 }}
          >
            {isCreating ? 'Creating…' : 'Generate via AI'}
          </button>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────
          Main two-column layout
          ─────────────────────────────────────────────────────────────*/}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* List */}
        <div>
          <h2>All Factions ({factions.length})</h2>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {factions.map(f => (
              <div
                key={f.id}
                onClick={() => handleSelectFaction(f)}
                style={{ backgroundColor: selectedFaction?.id === f.id ? '#e3f2fd' : 'white', padding: '0.75rem', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{f.name}</strong>
                  <span style={{ backgroundColor: statusColours[f.status], color: 'white', padding: '0.125rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>
                    {f.status}
                  </span>
                </div>
                {f.tags.length > 0 && (
                  <div style={{ marginTop: '0.25rem' }}>
                    {f.tags.map((tag, idx) => (
                      <span key={idx} style={{ backgroundColor: '#f5f5f5', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.75rem', marginRight: '0.25rem' }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Details panel */}
        <div>
          {selectedFaction ? (
            <>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}>
                <h2 style={{ marginTop: 0 }}>{selectedFaction.name}</h2>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <span style={{ backgroundColor: statusColours[selectedFaction.status], color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>{selectedFaction.status}</span>
                  <span style={{ backgroundColor: selectedFaction.banner_color || '#ccc', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>Members ≈ {selectedFaction.members_estimate}</span>
                </div>
                <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedFaction.ideology}</p>
                {selectedFaction.tags.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Tags:</strong>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {selectedFaction.tags.map((tag, index) => (
                        <span key={index} style={{ backgroundColor: '#e3f2fd', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.875rem' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
                  Created: {new Date(selectedFaction.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Historical timeline */}
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                <h3 style={{ marginTop: 0 }}>Historical Events</h3>
                {history.length === 0 ? (
                  <p style={{ color: '#666' }}>No historical events recorded</p>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {history.map((evt, idx) => (
                      <div key={idx} style={{ borderLeft: '3px solid #2196F3', paddingLeft: '1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>{new Date(evt.timestamp).toLocaleString()}</div>
                        <p style={{ margin: 0 }}>{evt.event}</p>
                        {evt.previous_status && (
                          <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#666' }}>Status: {evt.previous_status} → {selectedFaction.status}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ backgroundColor: '#f5f5f5', padding: '3rem', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center', color: '#666' }}>
              Select a faction to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 