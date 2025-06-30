import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { trpc } from '@/shared/lib/trpcClient';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/shared/lib/trpcClient';
import { WorldSphere } from './WorldSphere';
import { LocationModal, CharacterModal, FactionModal } from './EntityModal';
import './WorldDetail.styles.css';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type WorldState = RouterOutputs['world']['getWorldState'];
type World = WorldState['world'];
type Arc = WorldState['currentArc'];
type WorldEvent = WorldState['recentEvents'][number];


// Types for other entities
type Location = RouterOutputs['location']['list'][number];
type Character = RouterOutputs['character']['list'][number];
type Faction = RouterOutputs['faction']['list'][number];

export function WorldDetail() {
  const { worldId } = useParams<{ worldId: string }>();
  
  // World state
  const [world, setWorld] = useState<World | null>(null);
  const [currentArc, setCurrentArc] = useState<Arc | null>(null);
  const [beatEvents, setBeatEvents] = useState<WorldEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateArc, setShowCreateArc] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [storyIdea, setStoryIdea] = useState('');
  const [isProgressing, setIsProgressing] = useState(false);

  // Entity states
  const [locations, setLocations] = useState<Location[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  
  // Grouped entities
  const [groupedLocations, setGroupedLocations] = useState<Record<string, Location[]>>({});
  const [majorCharacters, setMajorCharacters] = useState<Character[]>([]);
  const [minorCharacters, setMinorCharacters] = useState<Character[]>([]);

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

  // Modal states
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isFactionModalOpen, setIsFactionModalOpen] = useState(false);
  
  // UI state
  const [expandedBeat, setExpandedBeat] = useState(false);
  const [showEventsList, setShowEventsList] = useState(true);
  const [viewDensity, setViewDensity] = useState<'compact' | 'standard' | 'detailed'>('standard');

  useEffect(() => {
    if (worldId) {
      fetchWorldDetails();
      fetchAllWorldData();
    } else {
      setError('No world ID provided');
      setIsLoading(false);
    }
  }, [worldId]);

  const fetchWorldDetails = async () => {
    if (!worldId) {
      setError('No world ID provided');
      return;
    }
    
    try {
      const worldState = await trpc.world.getWorldState.query(worldId);
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

  const fetchAllWorldData = async () => {
    if (!worldId) return;
    
    try {
      // Fetch all entity types in parallel
      const [locationsData, charactersData, factionsData] = await Promise.all([
        trpc.location.list.query({ worldId }),
        trpc.character.list.query({ worldId }),
        trpc.faction.list.query({ worldId })
      ]);
      
      // Set raw data
      setLocations(locationsData);
      setCharacters(charactersData);
      setFactions(factionsData);
      
      // Group locations by type
      const locationsByType = locationsData.reduce((acc, loc) => {
        if (!acc[loc.type]) acc[loc.type] = [];
        acc[loc.type].push(loc);
        return acc;
      }, {} as Record<string, Location[]>);
      setGroupedLocations(locationsByType);
      
      // Separate characters by story_role
      setMajorCharacters(charactersData.filter(c => c.story_role === 'major'));
      setMinorCharacters(charactersData.filter(c => 
        c.story_role === 'minor' || c.story_role === 'wildcard'
      ));
    } catch (err) {
      console.error('[WorldDetail] Failed to fetch world data:', err);
      // Don't set error state here to avoid blocking the main world view
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
      await fetchAllWorldData(); // Refresh all data after progression
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

  // Whenever the user clicks a beat update events list
  useEffect(() => {
    if (selectedBeat) {
      fetchBeatEvents(selectedBeat.id);
    }
  }, [selectedBeat]);

  // Modal handlers
  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setIsLocationModalOpen(true);
  };

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsCharacterModalOpen(true);
  };

  const handleFactionClick = (faction: Faction) => {
    setSelectedFaction(faction);
    setIsFactionModalOpen(true);
  };

  const closeAllModals = () => {
    setIsLocationModalOpen(false);
    setIsCharacterModalOpen(false);
    setIsFactionModalOpen(false);
    setSelectedLocation(null);
    setSelectedCharacter(null);
    setSelectedFaction(null);
  };

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

  // Count entities by type
  const regionCount = groupedLocations['region']?.length || 0;
  const cityCount = groupedLocations['city']?.length || 0;
  const landmarkCount = groupedLocations['landmark']?.length || 0;
  const wildernessCount = groupedLocations['wilderness']?.length || 0;
  const totalLocationCount = locations.length;
  
  const characterCount = characters.length;
  const factionCount = factions.length;

  return (
    <div className="world-detail">
      <header className="world-detail__header">
        <div className="world-detail__header-content">
          <Link to="/app/worlds" className="world-detail__back-link">
            <span className="material-icons">arrow_back</span>
            Back to Worlds
          </Link>
        </div>
      </header>

      {error && (
        <div className="world-detail__error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      <div className="world-detail__dashboard">
        
        {/* Story Arc Control Panel - Now at the top */}
        {currentArc && (
          <div className="world-detail__arc-control-panel">
            <div className="world-detail__arc-header">
              <div className="world-detail__arc-info">
                <h2 className="world-detail__arc-title">
                  <span className="material-icons">auto_stories</span>
                  {currentArc.story_name}
                </h2>
                <span className="world-detail__arc-status-badge">
                  Arc #{currentArc.arc_number} • {currentArc.status}
                </span>
              </div>
              
              <button
                onClick={progressArc}
                disabled={isProgressing}
                className="world-detail__progress-button-primary"
              >
                {isProgressing ? (
                  <>
                    <div className="world-detail__button-spinner"></div>
                    <span>Progressing Story...</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons">play_arrow</span>
                    <span>PROGRESS STORY</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Progress Bar with Beat Markers */}
            <div className="world-detail__arc-progress">
              <div className="world-detail__progress-bar-enhanced">
                <div 
                  className="world-detail__progress-fill-enhanced"
                  style={{ width: `${(beats.length / 15) * 100}%` }}
                >
                  <div className="world-detail__progress-glow"></div>
                </div>
                {/* Beat markers */}
                {beats.map((beat, index) => (
                  <div
                    key={beat.id}
                    className={`world-detail__beat-marker ${beat.beat_type === 'anchor' ? 'world-detail__beat-marker--anchor' : ''} ${selectedBeat?.id === beat.id ? 'world-detail__beat-marker--active' : ''}`}
                    style={{ left: `${(index / 14) * 100}%` }}
                    onClick={() => setSelectedBeat(beat)}
                    title={beat.beat_name}
                  >
                    <span className="world-detail__beat-marker-dot"></span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Current Beat Summary */}
            <div className="world-detail__current-beat-summary">
              {selectedBeat ? (
                <>
                  <div className="world-detail__beat-summary-header">
                    <h3 className="world-detail__beat-summary-title">
                      Current Beat: {selectedBeat.beat_name}
                      {selectedBeat.beat_type === 'anchor' && (
                        <span className="world-detail__beat-type-badge">Anchor</span>
                      )}
                    </h3>
                    <button
                      onClick={() => setExpandedBeat(!expandedBeat)}
                      className="world-detail__expand-button"
                    >
                      <span className="material-icons">
                        {expandedBeat ? 'expand_less' : 'expand_more'}
                      </span>
                      {expandedBeat ? 'Show Less' : 'Show More'}
                    </button>
                  </div>
                  
                  <p className="world-detail__beat-summary-description">
                    {selectedBeat.description}
                  </p>
                  
                  {expandedBeat && (
                    <div className="world-detail__beat-expanded">
                      <div className="world-detail__beat-details-grid">
                        <div className="world-detail__beat-directives">
                          <h4>World Directives</h4>
                          {selectedBeat.world_directives.length === 0 ? (
                            <p className="world-detail__beat-empty">None</p>
                          ) : (
                            <ul>
                              {selectedBeat.world_directives.map((d, i) => (
                                <li key={i}>{d}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        
                        <div className="world-detail__beat-storylines">
                          <h4>Emergent Storylines</h4>
                          {selectedBeat.emergent_storylines.length === 0 ? (
                            <p className="world-detail__beat-empty">None</p>
                          ) : (
                            <ul>
                              {selectedBeat.emergent_storylines.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="world-detail__beat-empty-state">
                  No beat generated yet. Click "Progress Story" to begin!
                </p>
              )}
            </div>
            
            {/* Beat Timeline (Horizontal) */}
            <div className="world-detail__beat-timeline">
              <h4 className="world-detail__timeline-title">Story Timeline</h4>
              <div className="world-detail__timeline-scroll">
                <div className="world-detail__timeline-track">
                  {beats.map((beat, index) => (
                    <button
                      key={beat.id}
                      onClick={() => setSelectedBeat(beat)}
                      className={`world-detail__timeline-beat ${selectedBeat?.id === beat.id ? 'world-detail__timeline-beat--active' : ''} ${beat.beat_type === 'anchor' ? 'world-detail__timeline-beat--anchor' : ''}`}
                    >
                      <span className="world-detail__timeline-beat-number">
                        {beat.beat_index}
                      </span>
                      <span className="world-detail__timeline-beat-name">
                        {beat.beat_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Quick Actions Bar */}
            <div className="world-detail__quick-actions">
              <button
                onClick={() => setShowAddEvent(!showAddEvent)}
                className="world-detail__quick-action"
              >
                <span className="material-icons">add_circle</span>
                Add Event
              </button>
              <button
                onClick={() => setShowEventsList(!showEventsList)}
                className="world-detail__quick-action"
              >
                <span className="material-icons">{showEventsList ? 'visibility_off' : 'visibility'}</span>
                {showEventsList ? 'Hide' : 'Show'} Events
              </button>
              <div className="world-detail__density-toggle">
                <button
                  onClick={() => setViewDensity('compact')}
                  className={`world-detail__density-option ${viewDensity === 'compact' ? 'world-detail__density-option--active' : ''}`}
                  title="Compact View"
                >
                  <span className="material-icons">view_agenda</span>
                </button>
                <button
                  onClick={() => setViewDensity('standard')}
                  className={`world-detail__density-option ${viewDensity === 'standard' ? 'world-detail__density-option--active' : ''}`}
                  title="Standard View"
                >
                  <span className="material-icons">view_module</span>
                </button>
                <button
                  onClick={() => setViewDensity('detailed')}
                  className={`world-detail__density-option ${viewDensity === 'detailed' ? 'world-detail__density-option--active' : ''}`}
                  title="Detailed View"
                >
                  <span className="material-icons">view_comfy</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Create Arc Panel if no active arc */}
        {!currentArc && (
          <div className="world-detail__no-arc-panel">
            {!showCreateArc ? (
              <div className="world-detail__no-arc-content">
                <span className="material-icons world-detail__no-arc-icon">auto_stories</span>
                <h2>Start Your Story</h2>
                <p>No active arc. Create one to begin your narrative journey!</p>
                <button
                  onClick={() => setShowCreateArc(true)}
                  className="world-detail__create-arc-button-hero"
                >
                  <span className="material-icons">add</span>
                  Create New Arc
                </button>
              </div>
            ) : (
              <div className="world-detail__create-arc-form">
                <h2>Create New Story Arc</h2>
                <form onSubmit={createNewArc}>
                  <div className="world-detail__form-group">
                    <label htmlFor="storyIdea">
                      Story Idea (optional)
                    </label>
                    <textarea
                      id="storyIdea"
                      value={storyIdea}
                      onChange={(e) => setStoryIdea(e.target.value)}
                      placeholder="Describe your story idea, or leave blank for a random arc..."
                      rows={4}
                    />
                  </div>
                  <div className="world-detail__form-actions">
                    <button type="submit" className="world-detail__submit-button">
                      <span className="material-icons">auto_stories</span>
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
        )}

        {/* Unified Gamemaster Panel */}
        <div className={`world-detail__unified-panel world-detail__unified-panel--${viewDensity}`}>
          {/* Left Section - Locations */}
          <div className="world-detail__section world-detail__section--locations">
            <div className="world-detail__section-header">
              <h2 className="world-detail__section-title">
                <span className="material-icons">place</span>
                Locations ({totalLocationCount})
              </h2>
            </div>
            
            <div className="world-detail__locations-content">
              {Object.entries(groupedLocations).length > 0 ? (
                <>
                  {/* Regions */}
                  {groupedLocations['region'] && (
                    <div className="world-detail__location-group">
                      <h3 className="world-detail__location-group-title">
                        Regions ({groupedLocations['region'].length})
                      </h3>
                      <ul className="world-detail__location-list">
                        {groupedLocations['region'].map(location => (
                          <li key={location.id} className="world-detail__location-item" onClick={() => handleLocationClick(location)}>
                            <span className={`world-detail__location-status world-detail__location-status--${location.status}`}></span>
                            {location.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Cities */}
                  {groupedLocations['city'] && (
                    <div className="world-detail__location-group">
                      <h3 className="world-detail__location-group-title">
                        Cities ({groupedLocations['city'].length})
                      </h3>
                      <ul className="world-detail__location-list">
                        {groupedLocations['city'].map(location => (
                          <li key={location.id} className="world-detail__location-item" onClick={() => handleLocationClick(location)}>
                            <span className={`world-detail__location-status world-detail__location-status--${location.status}`}></span>
                            {location.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Landmarks */}
                  {groupedLocations['landmark'] && (
                    <div className="world-detail__location-group">
                      <h3 className="world-detail__location-group-title">
                        Landmarks ({groupedLocations['landmark'].length})
                      </h3>
                      <ul className="world-detail__location-list">
                        {groupedLocations['landmark'].map(location => (
                          <li key={location.id} className="world-detail__location-item" onClick={() => handleLocationClick(location)}>
                            <span className={`world-detail__location-status world-detail__location-status--${location.status}`}></span>
                            {location.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Wilderness */}
                  {groupedLocations['wilderness'] && (
                    <div className="world-detail__location-group">
                      <h3 className="world-detail__location-group-title">
                        Wilderness ({groupedLocations['wilderness'].length})
                      </h3>
                      <ul className="world-detail__location-list">
                        {groupedLocations['wilderness'].map(location => (
                          <li key={location.id} className="world-detail__location-item" onClick={() => handleLocationClick(location)}>
                            <span className={`world-detail__location-status world-detail__location-status--${location.status}`}></span>
                            {location.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="world-detail__empty-message">
                  No locations found for this world
                </div>
              )}
            </div>
          </div>

          {/* Center Section - World Info & Events */}
          <div className="world-detail__section world-detail__section--center">
            {/* World Title, Description & Sphere */}
            <div className="world-detail__world-info">
              <h1 className="world-detail__title">{world.name}</h1>
              <p className="world-detail__description">{world.description}</p>
              <div className="world-detail__meta">
                Created {new Date(world.created_at).toLocaleDateString()}
              </div>
              
              {/* World Sphere */}
              <div className="world-detail__sphere-container">
                <WorldSphere seed={world.id} size={200} className="world-detail__sphere" />
                
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
            </div>

            {/* World Events Section */}
            <div className="world-detail__events-section">
              <div className="world-detail__section-header">
                <h2 className="world-detail__section-title">
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

            {showEventsList && (
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
            )}
            </div>
          </div>

          {/* Right Section - Characters & Factions */}
          <div className="world-detail__section world-detail__section--entities">
            {/* Characters Section */}
            <div className="world-detail__entity-section">
              <div className="world-detail__section-header">
                <h2 className="world-detail__section-title">
                  <span className="material-icons">person</span>
                  Characters ({characterCount})
                </h2>
              </div>
              
              <div className="world-detail__characters-content">
                {characters.length > 0 ? (
                  <>
                    {/* Major Characters */}
                    <div className="world-detail__character-group">
                      <h3 className="world-detail__character-group-title">
                        Major Characters ({majorCharacters.length})
                      </h3>
                      <ul className="world-detail__character-list">
                        {majorCharacters.map(character => (
                          <li key={character.id} className="world-detail__character-item" onClick={() => handleCharacterClick(character)}>
                            <span className={`world-detail__character-status world-detail__character-status--${character.status}`}></span>
                            {character.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Minor Characters */}
                    <div className="world-detail__character-group">
                      <h3 className="world-detail__character-group-title">
                        Minor Characters ({minorCharacters.length})
                      </h3>
                      <ul className="world-detail__character-list">
                        {minorCharacters.map(character => (
                          <li key={character.id} className="world-detail__character-item" onClick={() => handleCharacterClick(character)}>
                            <span className={`world-detail__character-status world-detail__character-status--${character.status}`}></span>
                            {character.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="world-detail__empty-message">
                    No characters found for this world
                  </div>
                )}
              </div>
            </div>
            
            {/* Factions Section */}
            <div className="world-detail__entity-section">
              <div className="world-detail__section-header">
                <h2 className="world-detail__section-title">
                  <span className="material-icons">groups</span>
                  Factions ({factionCount})
                </h2>
              </div>
              
              <div className="world-detail__factions-content">
                {factions.length > 0 ? (
                  <ul className="world-detail__faction-list">
                    {factions.map(faction => (
                      <li key={faction.id} className="world-detail__faction-item" onClick={() => handleFactionClick(faction)}>
                        <span className={`world-detail__faction-status world-detail__faction-status--${faction.status}`}></span>
                        {faction.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="world-detail__empty-message">
                    No factions found for this world
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Modals */}
      <LocationModal
        location={selectedLocation}
        isOpen={isLocationModalOpen}
        onClose={closeAllModals}
      />
      <CharacterModal
        character={selectedCharacter}
        isOpen={isCharacterModalOpen}
        onClose={closeAllModals}
      />
      <FactionModal
        faction={selectedFaction}
        isOpen={isFactionModalOpen}
        onClose={closeAllModals}
      />
      
      {/* Floating Action Button for Progress Story */}
      {currentArc && beats.length > 0 && (
        <button
          onClick={progressArc}
          disabled={isProgressing}
          className="world-detail__fab"
          title="Progress Story"
        >
          {isProgressing ? (
            <div className="world-detail__button-spinner"></div>
          ) : (
            <span className="material-icons">play_arrow</span>
          )}
        </button>
      )}
    </div>
  );
}