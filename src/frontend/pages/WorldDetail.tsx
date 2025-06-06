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
  const [recentEvents, setRecentEvents] = useState<WorldEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateArc, setShowCreateArc] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [storyIdea, setStoryIdea] = useState('');
  const [isProgressing, setIsProgressing] = useState(false);

  // Event form state
  const [newEvent, setNewEvent] = useState({
    eventType: 'character_arrives',
    description: '',
    characterName: '',
    characterDescription: '',
    locationName: '',
    itemName: '',
    itemDescription: ''
  });

  useEffect(() => {
    if (worldId) {
      fetchWorldDetails();
    }
  }, [worldId]);

  const fetchWorldDetails = async () => {
    try {
      const worldState = await trpc.world.getWorldState.query(worldId!);
      setWorld(worldState.world);
      setCurrentArc(worldState.currentArc);
      setRecentEvents(worldState.recentEvents);
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
      const eventData: any = {
        world_id: world.id,
        event_type: newEvent.eventType,
        description: newEvent.description
      };

      // Add specific data based on event type
      if (newEvent.eventType === 'character_arrives' || newEvent.eventType === 'character_leaves') {
        eventData.data = {
          characterName: newEvent.characterName,
          characterDescription: newEvent.characterDescription
        };
      } else if (newEvent.eventType === 'location_discovered') {
        eventData.data = {
          locationName: newEvent.locationName
        };
      } else if (newEvent.eventType === 'item_found' || newEvent.eventType === 'item_lost') {
        eventData.data = {
          itemName: newEvent.itemName,
          itemDescription: newEvent.itemDescription
        };
      }

      await trpc.world.recordWorldEvent.mutate(eventData);
      
      console.debug('[WorldDetail] Recorded event:', eventData);
      setShowAddEvent(false);
      setNewEvent({
        eventType: 'character_arrives',
        description: '',
        characterName: '',
        characterDescription: '',
        locationName: '',
        itemName: '',
        itemDescription: ''
      });
      await fetchWorldDetails();
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
        arcId: currentArc.id,
        recentEvents: JSON.stringify(recentEvents.slice(0, 5))
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
                      width: '0%',
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
                    onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="character_arrives">Character Arrives</option>
                    <option value="character_leaves">Character Leaves</option>
                    <option value="location_discovered">Location Discovered</option>
                    <option value="item_found">Item Found</option>
                    <option value="item_lost">Item Lost</option>
                    <option value="quest_started">Quest Started</option>
                    <option value="quest_completed">Quest Completed</option>
                    <option value="conflict_started">Conflict Started</option>
                    <option value="conflict_resolved">Conflict Resolved</option>
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

                {(newEvent.eventType === 'character_arrives' || newEvent.eventType === 'character_leaves') && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label htmlFor="characterName" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Character Name
                      </label>
                      <input
                        id="characterName"
                        type="text"
                        value={newEvent.characterName}
                        onChange={(e) => setNewEvent({ ...newEvent, characterName: e.target.value })}
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label htmlFor="characterDescription" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Character Description
                      </label>
                      <input
                        id="characterDescription"
                        type="text"
                        value={newEvent.characterDescription}
                        onChange={(e) => setNewEvent({ ...newEvent, characterDescription: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                  </>
                )}

                {newEvent.eventType === 'location_discovered' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="locationName" style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Location Name
                    </label>
                    <input
                      id="locationName"
                      type="text"
                      value={newEvent.locationName}
                      onChange={(e) => setNewEvent({ ...newEvent, locationName: e.target.value })}
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                )}

                {(newEvent.eventType === 'item_found' || newEvent.eventType === 'item_lost') && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label htmlFor="itemName" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Item Name
                      </label>
                      <input
                        id="itemName"
                        type="text"
                        value={newEvent.itemName}
                        onChange={(e) => setNewEvent({ ...newEvent, itemName: e.target.value })}
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label htmlFor="itemDescription" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Item Description
                      </label>
                      <input
                        id="itemDescription"
                        type="text"
                        value={newEvent.itemDescription}
                        onChange={(e) => setNewEvent({ ...newEvent, itemDescription: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                  </>
                )}

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
            {recentEvents.length === 0 ? (
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
              recentEvents.map((event) => (
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
    </div>
  );
}