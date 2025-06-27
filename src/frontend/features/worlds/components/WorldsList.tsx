import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trpc } from '@/shared/lib/trpcClient';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/shared/lib/trpcClient';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type World = RouterOutputs['world']['list'][number];

export function WorldsList() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  // Form state for new world
  const [newWorld, setNewWorld] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchWorlds();
  }, []);

  const fetchWorlds = async () => {
    try {
      const result = await trpc.world.list.query();
      setWorlds(result);
    } catch (err) {
      console.error('[WorldsList] Failed to fetch worlds:', err);
      setError('Failed to load worlds');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorld = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await trpc.world.create.mutate(newWorld);
      console.debug('[WorldsList] Created world:', created);
      setShowCreateForm(false);
      setNewWorld({ name: '', description: '' });
      await fetchWorlds();
    } catch (err) {
      console.error('[WorldsList] Failed to create world:', err);
      setError('Failed to create world');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading worlds...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
            ← Back to Dashboard
          </Link>
          <h1>Story Worlds</h1>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showCreateForm ? 'Cancel' : 'Create New World'}
        </button>
      </header>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          padding: '1rem',
          marginBottom: '1rem',
          border: '1px solid #ef5350',
          borderRadius: '4px',
          color: '#c62828'
        }}>
          {error}
        </div>
      )}

      {showCreateForm && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '2rem',
          marginBottom: '2rem',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h2>Create New World</h2>
          <form onSubmit={createWorld}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                World Name *
              </label>
              <input
                id="name"
                type="text"
                value={newWorld.name}
                onChange={(e) => setNewWorld({ ...newWorld, name: e.target.value })}
                required
                placeholder="e.g., The Enchanted Kingdom"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Description *
              </label>
              <textarea
                id="description"
                value={newWorld.description}
                onChange={(e) => setNewWorld({ ...newWorld, description: e.target.value })}
                required
                placeholder="Describe your world..."
                rows={4}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create World
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {worlds.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#666' }}>
            No worlds created yet. Create your first world to get started!
          </div>
        ) : (
          worlds.map((world) => (
            <div
              key={world.id}
              onClick={() => navigate(`/app/worlds/${world.id}`)}
              style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{world.name}</h3>
              <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {world.description}
              </p>
              <div style={{ fontSize: '0.875rem', color: '#999' }}>
                {new Date(world.created_at).toLocaleDateString()}
              </div>
              {world.current_arc_id && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#4CAF50' }}>
                  ✓ Active Arc
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}