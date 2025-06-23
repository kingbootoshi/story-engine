import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { trpc } from '../trpcClient';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../core/trpc/rootRouter';

// Helper types derived from tRPC router so the component stays fully type-safe.
type RouterOutputs = inferRouterOutputs<AppRouter>;
/** A single character returned by `character.list`. */
type Character = RouterOutputs['character']['list'][number];

/**
 * Characters management view – lists all characters of the selected world and lets
 * the user inspect details (description, motivations, background, etc.).
 *
 * The UI purposely remains lightweight – plain CSS-in-JS in line with the other
 * pages in the prototype frontend.
 */
export function Characters() {
  /* ──────────────────────────────────────────────────────────────────────────
   * Routing helpers & basic state buckets
   * ───────────────────────────────────────────────────────────────────────*/
  const { worldId } = useParams<{ worldId: string }>();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  /* ──────────────────────────────────────────────────────────────────────────
   * Data fetching helpers
   * ───────────────────────────────────────────────────────────────────────*/
  useEffect(() => {
    if (worldId) fetchCharacters();
    // Reset selection when world changes
    setSelected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldId]);

  const fetchCharacters = async () => {
    if (!worldId) return;
    try {
      const list = await trpc.character.list.query({ worldId });
      setCharacters(list);
    } catch (err) {
      /* eslint-disable no-console */
      console.error('[Characters] Failed to fetch:', err);
      setError('Failed to load characters');
    } finally {
      setIsLoading(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────────
   * JSX
   * ───────────────────────────────────────────────────────────────────────*/
  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading characters…</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <Link to={`/worlds/${worldId}`} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
          ← Back to World
        </Link>
        <h1>Characters</h1>
        <p style={{ color: '#666' }}>People that inhabit and drive the story of this world</p>
      </header>

      {error && (
        <div style={{ backgroundColor: '#ffebee', padding: '1rem', marginBottom: '1rem', border: '1px solid #ef5350', borderRadius: '4px', color: '#c62828' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Characters list */}
        <div>
          <h2>All Characters ({characters.length})</h2>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {characters.map((char) => (
              <div
                key={char.id}
                onClick={() => setSelected(char)}
                style={{
                  backgroundColor: selected?.id === char.id ? '#e3f2fd' : 'white',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{char.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>{char.story_role}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#999' }}>{char.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Details panel */}
        <div>
          {selected ? (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h2 style={{ marginTop: 0 }}>{selected.name}</h2>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#2196F3', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>{selected.type}</span>
                <span style={{ backgroundColor: '#9E9E9E', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>{selected.status}</span>
                <span style={{ backgroundColor: '#4CAF50', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>{selected.story_role}</span>
              </div>

              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selected.description}</p>

              {selected.motivations.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Motivations:</strong>
                  <ul style={{ marginTop: '0.25rem' }}>
                    {selected.motivations.map((m: string) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.personality_traits.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Personality Traits:</strong>
                  <ul style={{ marginTop: '0.25rem' }}>
                    {selected.personality_traits.map((t: string) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
                Created: {new Date(selected.created_at).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#f5f5f5', padding: '3rem', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center', color: '#666' }}>
              Select a character to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 