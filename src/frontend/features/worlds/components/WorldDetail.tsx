import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { trpc } from '@/shared/lib/trpcClient';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/shared/lib/trpcClient';
import { WorldSphere } from './WorldSphere';
import './WorldDetail.styles.css';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type WorldState = RouterOutputs['world']['getWorldState'];
type World = WorldState['world'];
type Arc = WorldState['currentArc'];
type WorldEvent = WorldState['recentEvents'][number];
type WorldBeat = WorldState['currentBeats'][number];

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
  const [activeTab, setActiveTab] = useState<'locations' | 'characters' | 'factions' | 'events'>('locations');
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
      <div className="world-detail__loading">
        <div className="world-detail__loading-spinner"></div>
        <p>Loading world details...</p>
      </div>
    );
  }

  if (!world) {
    return (
      <div className="world-detail__not-found">
        <h2>World not found</h2>
        <Link to="/app/worlds" className="world-detail__back-link">
          Return to Worlds
        </Link>
      </div>
    );
  }

  return (
    <div className="world-detail">
      <header className="world-detail__header">
        <div className="world-detail__header-content">
          <Link to="/app/worlds" className="world-detail__back-link">
            <span className="material-icons">arrow_back</span>
            Back to Worlds
          </Link>
          <h1 className="world-detail__title">{world.name}</h1>
          <p className="world-detail__description">{world.description}</p>
          <div className="world-detail__meta">
            Created {new Date(world.created_at).toLocaleDateString()}
          </div>
        </div>
      </header>

      {error && (
        <div className="world-detail__error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      <div className="world-detail__dashboard">
        {/* World Sphere in Center */}
        <div className="world-detail__sphere-container">
          <WorldSphere seed={world.id} size={250} className="world-detail__sphere" />
          
          {/* Current Arc Status */}
          <div className="world-detail__arc-status">
            {currentArc ? (
              <div className="world-detail__arc-badge">
                <span className="material-icons">auto_stories</span>
                Active Arc
              </div>
            ) : (
              <div className="world-detail__arc-badge world-detail__arc-badge--inactive">
                <span className="material-icons">auto_stories</span>
                No Active Arc
              </div>
            )}
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="world-detail__grid">
          {/* Left Column - Current Arc */}
          <div className="world-detail__panel world-detail__panel--arc">
            <div className="world-detail__panel-header">
              <h2 className="world-detail__panel-title">
                <span className="material-icons">auto_stories</span>
                Current Arc
              </h2>
            </div>
            
            {currentArc ? (
              <div className="world-detail__arc-content">
                <h3 className="world-detail__arc-name">{currentArc.story_name}</h3>
                <p className="world-detail__arc-idea">{currentArc.story_idea}</p>
                
                {currentArc.detailed_description && (
                  <div className="world-detail__arc-description">
                    <strong>Arc Overview:</strong>
                    <p>{currentArc.detailed_description}</p>
                  </div>
                )}
                
                <div className="world-detail__arc-meta">
                  <div>Arc #{currentArc.arc_number} — Status: {currentArc.status}</div>
                  <div className="world-detail__progress-bar">
                    <div 
                      className="world-detail__progress-fill"
                      style={{ width: `${(beats.length / 15) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <button
                  onClick={progressArc}
                  disabled={isProgressing}
                  className="world-detail__progress-button"
                >
                  {isProgressing ? (
                    <>
                      <div className="world-detail__button-spinner"></div>
                      Progressing Story...
                    </>
                  ) : (
                    <>
                      <span className="material-icons">play_arrow</span>
                      Progress Story
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="world-detail__arc-empty">
                <p>No active arc. Create one to start the story!</p>
                <button
                  onClick={() => setShowCreateArc(true)}
                  className="world-detail__create-arc-button"
                >
                  <span className="material-icons">add</span>
                  Create New Arc
                </button>
              </div>
            )}

            {showCreateArc && (
              <div className="world-detail__create-arc">
                <h3>Create New Story Arc</h3>
                <form onSubmit={createNewArc}>
                  <label htmlFor="storyIdea">
                    Story Idea (optional)
                  </label>
                  <textarea
                    id="storyIdea"
                    value={storyIdea}
                    onChange={(e) => setStoryIdea(e.target.value)}
                    placeholder="Describe your story idea, or leave blank for a random arc..."
                    rows={3}
                  />
                  <div className="world-detail__form-actions">
                    <button type="submit" className="world-detail__submit-button">
                      Create Arc
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowCreateArc(false)}
                      className="world-detail__cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Column - World Events */}
          <div className="world-detail__panel world-detail__panel--events">
            <div className="world-detail__panel-header">
              <h2 className="world-detail__panel-title">
                <span className="material-icons">event_note</span>
                World Events
              </h2>
              {currentArc && (
                <button
                  onClick={() => setShowAddEvent(!showAddEvent)}
                  className="world-detail__add-button"
                >
                  <span className="material-icons">add</span>
                  Add Event
                </button>
              )}
            </div>

            {showAddEvent && (
              <div className="world-detail__add-event">
                <h3>Add World Event</h3>
                <form onSubmit={recordEvent}>
                  <div className="world-detail__form-group">
                    <label htmlFor="eventType">
                      Event Type
                    </label>
                    <select
                      id="eventType"
                      value={newEvent.eventType}
                      onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value as any })}
                    >
                      <option value="player_action">Player Action</option>
                      <option value="world_event">World Event</option>
                      <option value="system_event">System Event</option>
                    </select>
                  </div>

                  <div className="world-detail__form-group">
                    <label htmlFor="impactLevel">
                      Impact Level
                    </label>
                    <select
                      id="impactLevel"
                      value={newEvent.impactLevel}
                      onChange={(e) => setNewEvent({ ...newEvent, impactLevel: e.target.value as any })}
                    >
                      <option value="minor">Minor</option>
                      <option value="moderate">Moderate</option>
                      <option value="major">Major</option>
                    </select>
                  </div>

                  <div className="world-detail__form-group">
                    <label htmlFor="description">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      required
                      placeholder="Describe what happened..."
                      rows={2}
                    />
                  </div>

                  <div className="world-detail__form-actions">
                    <button type="submit" className="world-detail__submit-button">
                      Add Event
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowAddEvent(false)}
                      className="world-detail__cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="world-detail__events-list">
              {beatEvents.length === 0 ? (
                <div className="world-detail__events-empty">
                  No events recorded yet
                </div>
              ) : (
                beatEvents.map((event) => (
                  <div
                    key={event.id}
                    className="world-detail__event-item"
                  >
                    <div className="world-detail__event-header">
                      <span className={`world-detail__event-impact world-detail__event-impact--${event.impact_level}`}>
                        {event.impact_level.toUpperCase()}
                      </span>
                      <span className="world-detail__event-time">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="world-detail__event-description">{event.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Row - Tabs for Locations, Characters, Factions */}
          <div className="world-detail__panel world-detail__panel--tabs">
            <div className="world-detail__tabs">
              <button 
                className={`world-detail__tab ${activeTab === 'locations' ? 'world-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('locations')}
              >
                <span className="material-icons">place</span>
                Locations
              </button>
              <button 
                className={`world-detail__tab ${activeTab === 'characters' ? 'world-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('characters')}
              >
                <span className="material-icons">person</span>
                Characters
              </button>
              <button 
                className={`world-detail__tab ${activeTab === 'factions' ? 'world-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('factions')}
              >
                <span className="material-icons">groups</span>
                Factions
              </button>
              <button 
                className={`world-detail__tab ${activeTab === 'events' ? 'world-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                <span className="material-icons">history</span>
                Beat History
              </button>
            </div>

            <div className="world-detail__tab-content">
              {activeTab === 'locations' && (
                <div className="world-detail__locations">
                  {locationsSummary ? (
                    <div className="world-detail__locations-summary">
                      <div className="world-detail__locations-total">
                        <span className="world-detail__stat-number">{locationsSummary.total}</span>
                        <span className="world-detail__stat-label">Total Locations</span>
                      </div>
                      <div className="world-detail__locations-types">
                        {Object.entries(locationsSummary.byType).map(([type, count]) => (
                          <div key={type} className="world-detail__location-type">
                            <span className="world-detail__stat-number">{count}</span>
                            <span className="world-detail__stat-label">{type}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="world-detail__loading">Loading locations...</div>
                  )}
                  <Link to={`/app/worlds/${worldId}/locations`} className="world-detail__view-all">
                    <span className="material-icons">visibility</span>
                    View All Locations
                  </Link>
                </div>
              )}

              {activeTab === 'characters' && (
                <div className="world-detail__characters">
                  <div className="world-detail__characters-placeholder">
                    <span className="material-icons">people</span>
                    <p>Characters bring your world to life</p>
                  </div>
                  <Link to={`/app/worlds/${worldId}/characters`} className="world-detail__view-all">
                    <span className="material-icons">visibility</span>
                    View All Characters
                  </Link>
                </div>
              )}

              {activeTab === 'factions' && (
                <div className="world-detail__factions">
                  <div className="world-detail__factions-placeholder">
                    <span className="material-icons">account_balance</span>
                    <p>Factions shape the political landscape</p>
                  </div>
                  <Link to={`/app/worlds/${worldId}/factions`} className="world-detail__view-all">
                    <span className="material-icons">visibility</span>
                    View All Factions
                  </Link>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="world-detail__beats">
                  <h3 className="world-detail__beats-title">Story Beats</h3>
                  {beats.length === 0 ? (
                    <p className="world-detail__beats-empty">No beats generated yet.</p>
                  ) : (
                    <ul className="world-detail__beats-list">
                      {beats
                        .sort((a, b) => a.beat_index - b.beat_index)
                        .map((beat) => (
                          <li
                            key={beat.id}
                            onClick={() => setSelectedBeat(beat)}
                            className={`world-detail__beat-item ${selectedBeat?.id === beat.id ? 'world-detail__beat-item--selected' : ''} ${beat.beat_type === 'anchor' ? 'world-detail__beat-item--anchor' : ''}`}
                          >
                            <span className="world-detail__beat-index">Beat {beat.beat_index}</span>
                            <span className="world-detail__beat-name">{beat.beat_name}</span>
                            {beat.beat_type === 'anchor' && (
                              <span className="world-detail__beat-anchor-badge">Anchor</span>
                            )}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Panel - Selected Beat Details */}
          {selectedBeat && (
            <div className="world-detail__panel world-detail__panel--beat-details">
              <h3 className="world-detail__beat-detail-title">
                {selectedBeat.beat_name}
                {selectedBeat.beat_type === 'anchor' && (
                  <span className="world-detail__beat-type-badge">Anchor</span>
                )}
              </h3>
              <p className="world-detail__beat-description">{selectedBeat.description}</p>

              <div className="world-detail__beat-sections">
                <div className="world-detail__beat-section">
                  <h4 className="world-detail__beat-section-title">World Directives</h4>
                  {selectedBeat.world_directives.length === 0 ? (
                    <p className="world-detail__beat-empty">—</p>
                  ) : (
                    <ul className="world-detail__beat-list">
                      {selectedBeat.world_directives.map((d, i) => (
                        <li key={i} className="world-detail__beat-list-item">{d}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="world-detail__beat-section">
                  <h4 className="world-detail__beat-section-title">Emergent Storylines</h4>
                  {selectedBeat.emergent_storylines.length === 0 ? (
                    <p className="world-detail__beat-empty">—</p>
                  ) : (
                    <ul className="world-detail__beat-list">
                      {selectedBeat.emergent_storylines.map((s, i) => (
                        <li key={i} className="world-detail__beat-list-item">{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}