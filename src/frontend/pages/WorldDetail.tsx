import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { trpc } from '../trpcClient';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../core/trpc/rootRouter';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type WorldState = RouterOutputs['world']['getWorldState'];
type World = WorldState['world'];
type Arc = WorldState['currentArc'];
type WorldEvent = WorldState['recentEvents'][number];

export function WorldDetail() {
  const { worldId } = useParams<{ worldId: string }>();
  
  const [world, setWorld] = useState<World | null>(null);
  const [currentArc, setCurrentArc] = useState<Arc | null>(null);
  const [beatEvents, setBeatEvents] = useState<WorldEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateArc, setShowCreateArc] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [storyIdea, setStoryIdea] = useState('');
  const [isProgressing, setIsProgressing] = useState(false);
  const [locationsSummary, setLocationsSummary] = useState<{total: number, byType: Record<string, number>} | null>(null);

  // Event form state
  const [newEvent, setNewEvent] = useState({
    eventType: 'player_action' as 'player_action' | 'system_event' | 'world_event',
    impactLevel: 'minor' as 'minor' | 'moderate' | 'major',
    description: ''
  });

  /** Holds every beat (anchor + dynamic) for the currently active arc */
  const [beats, setBeats] = useState<WorldState['currentBeats']>([]);

  /** When the user clicks a beat in the list we keep it here so we can render the details */
  const [selectedBeat, setSelectedBeat] = useState<WorldState['currentBeats'][number] | null>(null);

  useEffect(() => {
    if (worldId) {
      fetchWorldDetails();
      fetchLocationsSummary();
    }
  }, [worldId]);

  const fetchWorldDetails = async () => {
    try {
      const worldState = await trpc.world.getWorldState.query(worldId!);
      console.debug('[WorldDetail] Loaded world state', {
        worldId: worldState.world.id,
        arcId: worldState.currentArc?.id,
        currentBeatId: worldState.currentArc?.current_beat_id,
        beatCount: worldState.currentBeats.length
      });
      
      setWorld(worldState.world);
      setCurrentArc(worldState.currentArc);

      setBeats(worldState.currentBeats);

      // Find the current beat using the arc's current_beat_id
      if (worldState.currentArc?.current_beat_id) {
        const currentBeat = worldState.currentBeats.find(
          beat => beat.id === worldState.currentArc!.current_beat_id
        );
        if (currentBeat) {
          console.debug('[WorldDetail] Found current beat', {
            beatId: currentBeat.id,
            beatIndex: currentBeat.beat_index,
            beatName: currentBeat.beat_name
          });
          setSelectedBeat(currentBeat);
          await fetchBeatEvents(currentBeat.id);
        }
      }
    } catch (err) {
      console.error('[WorldDetail] Failed to fetch world:', err);
      setError('Failed to load world details');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewArc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!world) return;

    try {
      const { arc } = await trpc.world.createNewArc.mutate({
        worldId: world.id,
        worldName: world.name,
        worldDescription: world.description,
        storyIdea
      });
      
      console.debug('[WorldDetail] Created arc:', arc);
      setCurrentArc(arc);
      setShowCreateArc(false);
      setStoryIdea('');
      await fetchWorldDetails();
    } catch (err) {
      console.error('[WorldDetail] Failed to create arc:', err);
      setError('Failed to create new arc');
    }
  };

  const recordEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!world) return;

    try {
      if (!currentArc || beats.length === 0) {
        alert('No current beat to attach the event to. Generate a beat first.');
        return;
      }

      // Determine the beat to attach to – the one the user selected or the latest.
      const beat = selectedBeat ?? beats[beats.length - 1];

      await trpc.world.recordWorldEvent.mutate({
        world_id: world.id,
        event_type: newEvent.eventType,
        impact_level: newEvent.impactLevel,
        description: newEvent.description
      });
      
      console.debug('[WorldDetail] Recorded event:', {
        world_id: world.id,
        event_type: newEvent.eventType,
        impact_level: newEvent.impactLevel,
        description: newEvent.description
      });
      setShowAddEvent(false);
      setNewEvent({
        eventType: 'player_action',
        impactLevel: 'minor',
        description: ''
      });
      await fetchBeatEvents(beat.id);
    } catch (err) {
      console.error('[WorldDetail] Failed to record event:', err);
      setError('Failed to record event');
    }
  };

  const progressArc = async () => {
    if (!currentArc || !world) return;

    setIsProgressing(true);
    try {
      const result = await trpc.world.progressArc.mutate({
        worldId: world.id,
        arcId: currentArc.id
      });

      console.debug('[WorldDetail] Arc progressed:', result);
      
      if (!result) {
        // Arc is complete
        alert('Arc is complete! You can create a new arc to continue the story.');
      }
      
      await fetchWorldDetails();
    } catch (err) {
      console.error('[WorldDetail] Failed to progress arc:', err);
      setError('Failed to progress arc');
    } finally {
      setIsProgressing(false);
    }
  };

  const fetchBeatEvents = async (beatId: string) => {
    try {
      const events = await trpc.world.getBeatEvents.query(beatId);
      setBeatEvents(events);
    } catch (err) {
      console.error('[WorldDetail] Failed to fetch beat events:', err);
    }
  };

  const fetchLocationsSummary = async () => {
    try {
      const locations = await trpc.location.list.query({ worldId: worldId! });
      const summary = {
        total: locations.length,
        byType: locations.reduce((acc, loc) => {
          acc[loc.type] = (acc[loc.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      setLocationsSummary(summary);
    } catch (err) {
      console.error('[WorldDetail] Failed to fetch locations summary:', err);
    }
  };

  // Whenever the user clicks a beat update events list
  useEffect(() => {
    if (selectedBeat) {
      fetchBeatEvents(selectedBeat.id);
    }
  }, [selectedBeat]);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading world details...
      </div>
    );
  }

  if (!world) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        World not found
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link to="/worlds" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
          ← Back to Worlds
        </Link>
        <h1>{world.name}</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>{world.description}</p>
        <div style={{ marginTop: '0.5rem', color: '#999' }}>
          Created {new Date(world.created_at).toLocaleDateString()}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link 
            to={`/worlds/${worldId}/locations`}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#9C27B0',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            View Locations
          </Link>
        </div>
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

      {/* Locations Summary */}
      {locationsSummary && locationsSummary.total > 0 && (
        <div style={{
          backgroundColor: '#f3e5f5',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #ce93d8'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Locations Overview</h3>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '1.5rem' }}>{locationsSummary.total}</strong> Total Locations
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {Object.entries(locationsSummary.byType).map(([type, count]) => (
                <div key={type} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{count}</div>
                  <div style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    {type}{count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <h2>Current Arc</h2>
          {currentArc ? (
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h3 style={{ marginTop: 0 }}>{currentArc.story_name}</h3>
              <p>{currentArc.story_idea}</p>
              {currentArc.detailed_description && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '4px',
                  fontSize: '0.95rem',
                  lineHeight: '1.6'
                }}>
                  <strong>Arc Overview:</strong>
                  <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                    {currentArc.detailed_description}
                  </p>
                </div>
              )}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  Arc #{currentArc.arc_number} — Status: {currentArc.status}
                </div>
                <div style={{
                  backgroundColor: '#ddd',
                  height: '20px',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      backgroundColor: '#4CAF50',
                      height: '100%',
                      /**
                       * The arc always tops out at 15 beats (0-14). We derive completion % directly
                       * from the amount of beats that exist so far. This value animates via the
                       * CSS transition declared below for a pleasant visual cue whenever a new beat
                       * is created.
                       */
                      width: `${(beats.length / 15) * 100}%`,
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
              </div>
              <button
                onClick={progressArc}
                disabled={isProgressing}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isProgressing ? 'not-allowed' : 'pointer',
                  opacity: isProgressing ? 0.6 : 1
                }}
              >
                {isProgressing ? 'Progressing Story...' : 'Progress Story'}
              </button>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              textAlign: 'center'
            }}>
              <p style={{ marginBottom: '1rem' }}>No active arc. Create one to start the story!</p>
              <button
                onClick={() => setShowCreateArc(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create New Arc
              </button>
            </div>
          )}

          {showCreateArc && (
            <div style={{
              marginTop: '1rem',
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h3>Create New Story Arc</h3>
              <form onSubmit={createNewArc}>
                <label htmlFor="storyIdea" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Story Idea (optional)
                </label>
                <textarea
                  id="storyIdea"
                  value={storyIdea}
                  onChange={(e) => setStoryIdea(e.target.value)}
                  placeholder="Describe your story idea, or leave blank for a random arc..."
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Create Arc
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateArc(false)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>World Events</h2>
            {currentArc && (
              <button
                onClick={() => setShowAddEvent(!showAddEvent)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Add Event
              </button>
            )}
          </div>

          {showAddEvent && (
            <div style={{
              marginBottom: '1rem',
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h3>Add World Event</h3>
              <form onSubmit={recordEvent}>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="eventType" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Event Type
                  </label>
                  <select
                    id="eventType"
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value as 'player_action' | 'system_event' | 'world_event' })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="player_action">Player Action</option>
                    <option value="world_event">World Event</option>
                    <option value="system_event">System Event</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="impactLevel" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Impact Level
                  </label>
                  <select
                    id="impactLevel"
                    value={newEvent.impactLevel}
                    onChange={(e) => setNewEvent({ ...newEvent, impactLevel: e.target.value as 'minor' | 'moderate' | 'major' })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="major">Major</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    required
                    placeholder="Describe what happened..."
                    rows={2}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddEvent(false)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {beatEvents.length === 0 ? (
              <div style={{
                backgroundColor: '#f5f5f5',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                textAlign: 'center',
                color: '#666'
              }}>
                No events recorded yet
              </div>
            ) : (
              beatEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                    <span style={{ fontSize: '0.875rem', color: '#999' }}>
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#666' }}>{event.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/*
        ─────────────────────────────────────────────────────────────────────
        Beats list – clicking a beat reveals its full details underneath.
        We purposely keep the styling simple (plain <ul>/<li>) because the
        current frontend is meant purely for manual QA.
       */}

      {currentArc && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>Beats</h3>
          {beats.length === 0 ? (
            <p style={{ color: '#666' }}>No beats generated yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {beats
                .sort((a, b) => a.beat_index - b.beat_index)
                .map((beat) => (
                  <li
                    key={beat.id}
                    onClick={() => setSelectedBeat(beat)}
                    style={{
                      cursor: 'pointer',
                      marginBottom: '0.25rem',
                      padding: '0.5rem',
                      backgroundColor: selectedBeat?.id === beat.id ? '#e0f7fa' : '#fff',
                      border: '1px solid #ddd',
                      borderLeft: `6px solid ${beat.beat_type === 'anchor' ? '#FF9800' : '#2196F3'}`
                    }}
                  >
                    <strong style={{ marginRight: '0.25rem' }}>Beat {beat.beat_index}</strong>
                    — {beat.beat_name} {beat.beat_type === 'anchor' && ' (Anchor)'}
                  </li>
                ))}
            </ul>
          )}

          {/* Detailed view for the selected beat */}
          {selectedBeat && (
            <div style={{
              marginTop: '1.5rem',
              backgroundColor: '#fff',
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '6px'
            }}>
              <h4 style={{ marginTop: 0 }}>{selectedBeat.beat_name}{' '}
                {selectedBeat.beat_type === 'anchor' && <span style={{ color: '#FF9800' }}>(Anchor)</span>}
              </h4>
              <p style={{ whiteSpace: 'pre-line', color: '#555' }}>{selectedBeat.description}</p>

              <div style={{ marginTop: '1rem' }}>
                <strong>World Directives</strong>
                {selectedBeat.world_directives.length === 0 ? (
                  <p style={{ color: '#777' }}>—</p>
                ) : (
                  <ul style={{ marginTop: '0.25rem' }}>
                    {selectedBeat.world_directives.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <strong>Emergent Storylines</strong>
                {selectedBeat.emergent_storylines.length === 0 ? (
                  <p style={{ color: '#777' }}>—</p>
                ) : (
                  <ul style={{ marginTop: '0.25rem' }}>
                    {selectedBeat.emergent_storylines.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}