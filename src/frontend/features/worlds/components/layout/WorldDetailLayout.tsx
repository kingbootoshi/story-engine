import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { trpc } from '@/shared/lib/trpcClient';
import { WorldHeader } from './WorldHeader';
import { WorldInfoPanel } from './WorldInfoPanel';
import { ArcControlPanel } from '../arc/ArcControlPanel';
import { BeatTimeline } from '../arc/BeatTimeline';
import { BeatDetails } from '../arc/BeatDetails';
import { CreateArcPanel } from '../arc/CreateArcPanel';
import { WorldSeedingPanel } from '../seeding/WorldSeedingPanel';
import { EventModal } from '../events/EventModal';

import { LocationSection } from '../entities/LocationSection';
import { CharacterSection } from '../entities/CharacterSection';
import { FactionSection } from '../entities/FactionSection';
import { EventsSection } from '../events/EventsSection';
import { LocationModal, CharacterModal, FactionModal } from '../modals/EntityModal';
import {
  useWorldData,
  useArcProgression,
  useEventManagement,
  useEntityData,
  useEntityModals,
  useUIState
} from '../../hooks';
import { useSound } from '@/features/audio';
import '../../styles/index.css';

type MobileTab = 'world' | 'arc' | 'locations' | 'characters';

export function WorldDetailLayout() {
  const { worldId } = useParams<{ worldId: string }>();
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('world');
  const { play } = useSound();
  
  // Custom hooks
  const {
    world,
    currentArc,
    beats,
    selectedBeat,
    isLoading,
    error,
    setCurrentArc,
    setSelectedBeat,
    setError,
    fetchWorldDetails
  } = useWorldData(worldId);

  const {
    isProgressing,
    isCreatingArc,
    showCreateArc,
    storyIdea,
    setShowCreateArc,
    setStoryIdea,
    createNewArc,
    progressArc
  } = useArcProgression();

  const {
    beatEvents,
    showAddEvent,
    showEventsList,
    newEvent,
    setShowAddEvent,
    setNewEvent,
    fetchBeatEvents,
    recordEvent
  } = useEventManagement();

  const {
    locations,
    characters,
    factions,
    groupedLocations,
    majorCharacters,
    minorCharacters,
    fetchAllWorldData
  } = useEntityData(worldId);

  const {
    selectedLocation,
    selectedCharacter,
    selectedFaction,
    isLocationModalOpen,
    isCharacterModalOpen,
    isFactionModalOpen,
    handleLocationClick,
    handleCharacterClick,
    handleFactionClick,
    closeAllModals
  } = useEntityModals();

  const {
    expandedBeat,
    setExpandedBeat
  } = useUIState();
  
  const viewDensity = 'standard'; // Always use standard density
  
  // Seeding state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState<{
    phase: 'locations' | 'factions' | 'characters';
    status: 'started' | 'completed';
    message: string;
    count?: number;
  } | undefined>();

  // Whenever the user clicks a beat update events list
  useEffect(() => {
    if (selectedBeat) {
      fetchBeatEvents(selectedBeat.id);
    }
  }, [selectedBeat]);

  // Event handlers
  const handleCreateArc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!world) return;

    await createNewArc(
      world,
      storyIdea,
      (arc) => {
        setCurrentArc(arc);
        fetchWorldDetails();
      },
      setError
    );
  };

  const handleProgressArc = async () => {
    if (!currentArc || !world) return;

    await progressArc(
      world,
      currentArc,
      async () => {
        await fetchWorldDetails();
        await fetchAllWorldData();
        // Play arc completion sound
        play('arc_done');
      },
      setError
    );
  };

  const handleRecordEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!world) return;

    await recordEvent(
      world.id,
      selectedBeat,
      beats,
      () => {
        setShowAddEvent(false); // Close modal on success
      },
      setError
    );
  };

  const handleOpenEventModal = () => {
    setShowAddEvent(true);
  };

  const handleCloseEventModal = () => {
    setShowAddEvent(false);
    // Reset form on close
    setNewEvent({
      eventType: 'player_action',
      impactLevel: 'minor',
      description: ''
    });
  };

  const handleSeedWorld = async () => {
    if (!worldId) return;
    
    setIsSeeding(true);
    setSeedingProgress(undefined);
    
    try {
      // Make the API call to seed the world
      await trpc.world.seedWorld.mutate({ worldId });
      
      // Poll for updates - in a real implementation, you'd use WebSockets or SSE
      const pollInterval = setInterval(async () => {
        await fetchAllWorldData();
        
        // Check if seeding is complete
        const [locs, chars, facts] = await Promise.all([
          trpc.location.list.query({ worldId }),
          trpc.character.list.query({ worldId }),
          trpc.faction.list.query({ worldId })
        ]);
        
        if (locs.length > 0 && chars.length > 0 && facts.length > 0) {
          clearInterval(pollInterval);
          setIsSeeding(false);
          setSeedingProgress(undefined);
          // Play generation complete sound
          play('gen_done');
        }
      }, 2000); // Poll every 2 seconds
      
      // Simulate progress updates (in production, these would come from server events)
      setTimeout(() => {
        setSeedingProgress({
          phase: 'locations',
          status: 'started',
          message: 'Generating world regions and locations...'
        });
      }, 1000);
      
      setTimeout(() => {
        setSeedingProgress({
          phase: 'factions',
          status: 'started',
          message: 'Creating factions and their ideologies...'
        });
      }, 15000);
      
      setTimeout(() => {
        setSeedingProgress({
          phase: 'characters',
          status: 'started',
          message: 'Populating the world with characters...'
        });
      }, 25000);
      
    } catch (error) {
      console.error('Failed to seed world:', error);
      setError('Failed to seed world. Please try again.');
      setIsSeeding(false);
      setSeedingProgress(undefined);
    }
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
  const totalLocationCount = locations.length;
  const characterCount = characters.length;
  const factionCount = factions.length;

  return (
    <div className="world-detail">
      <WorldHeader error={error} />

      <div className="world-detail__dashboard">
        
        {/* Story Arc Control Panel - Now at the top */}
        {currentArc && (
          <>
            <ArcControlPanel
              currentArc={currentArc}
              isProgressing={isProgressing}
              onProgressArc={handleProgressArc}
              onAddEvent={handleOpenEventModal}
            />
            
            <BeatTimeline
              beats={beats}
              selectedBeat={selectedBeat}
              onBeatSelect={setSelectedBeat}
            />
            
            <BeatDetails
              selectedBeat={selectedBeat}
              expandedBeat={expandedBeat}
              onToggleExpanded={() => setExpandedBeat(!expandedBeat)}
            />
            

          </>
        )}
        
        {/* Show seeding panel if world is unseeded */}
        {!currentArc && locations.length === 0 && factions.length === 0 && characters.length === 0 && !isLoading && (
          <WorldSeedingPanel
            worldId={worldId!}
            onSeedWorld={handleSeedWorld}
            isSeeding={isSeeding}
            seedingProgress={seedingProgress}
          />
        )}
        
        {/* Create Arc Panel if world is seeded but no active arc */}
        {!currentArc && (locations.length > 0 || factions.length > 0 || characters.length > 0) && (
          <CreateArcPanel
            showCreateArc={showCreateArc}
            storyIdea={storyIdea}
            isCreating={isCreatingArc}
            onStoryIdeaChange={setStoryIdea}
            onToggleForm={() => setShowCreateArc(!showCreateArc)}
            onSubmit={handleCreateArc}
          />
        )}

        {/* Desktop View - Unified Gamemaster Panel */}
        <div className={`world-detail__unified-panel world-detail__unified-panel--${viewDensity}`}>
          {/* Left Section - Locations */}
          <div className="world-detail__section">
            <LocationSection
              groupedLocations={groupedLocations}
              totalLocationCount={totalLocationCount}
              onLocationClick={handleLocationClick}
            />
          </div>

          {/* Center Section - World Info & Events */}
          <div className="world-detail__section world-detail__section--center">
            <WorldInfoPanel world={world} currentArc={currentArc} />
            
            <EventsSection
              currentArc={currentArc}
              showEventsList={showEventsList}
              beatEvents={beatEvents}
              onToggleAddEvent={handleOpenEventModal}
            />
          </div>

          {/* Right Section - Factions & Characters */}
          <div className="world-detail__section world-detail__section--entities">
            <FactionSection
              factions={factions}
              factionCount={factionCount}
              onFactionClick={handleFactionClick}
            />
            
            <CharacterSection
              majorCharacters={majorCharacters}
              minorCharacters={minorCharacters}
              characterCount={characterCount}
              onCharacterClick={handleCharacterClick}
            />
          </div>
        </div>

        {/* Mobile Tab Navigation - Now at the top */}
        <nav className="world-detail__mobile-tabs">
          <div className="world-detail__mobile-tabs-list">
            <button
              className={`world-detail__mobile-tab ${activeMobileTab === 'world' ? 'world-detail__mobile-tab--active' : ''}`}
              onClick={() => setActiveMobileTab('world')}
            >
              <span className="material-icons world-detail__mobile-tab-icon">public</span>
              <span className="world-detail__mobile-tab-label">World</span>
            </button>
            
            <button
              className={`world-detail__mobile-tab ${activeMobileTab === 'arc' ? 'world-detail__mobile-tab--active' : ''}`}
              onClick={() => setActiveMobileTab('arc')}
            >
              <span className="material-icons world-detail__mobile-tab-icon">auto_stories</span>
              <span className="world-detail__mobile-tab-label">Arc</span>
            </button>
            
            <button
              className={`world-detail__mobile-tab ${activeMobileTab === 'locations' ? 'world-detail__mobile-tab--active' : ''}`}
              onClick={() => setActiveMobileTab('locations')}
            >
              <span className="material-icons world-detail__mobile-tab-icon">place</span>
              <span className="world-detail__mobile-tab-label">Locations</span>
            </button>
            
            <button
              className={`world-detail__mobile-tab ${activeMobileTab === 'characters' ? 'world-detail__mobile-tab--active' : ''}`}
              onClick={() => setActiveMobileTab('characters')}
            >
              <span className="material-icons world-detail__mobile-tab-icon">person</span>
              <span className="world-detail__mobile-tab-label">Characters</span>
            </button>
          </div>
        </nav>

        {/* Mobile View - Tab-based sections */}
        <div className="world-detail__mobile-content">
          {/* World Tab */}
          <div className={`world-detail__section ${activeMobileTab === 'world' ? 'world-detail__section--active' : ''}`}>
            {/* Show seeding panel on mobile World tab if world is unseeded */}
            {!currentArc && locations.length === 0 && factions.length === 0 && characters.length === 0 && !isLoading && (
              <WorldSeedingPanel
                worldId={worldId!}
                onSeedWorld={handleSeedWorld}
                isSeeding={isSeeding}
                seedingProgress={seedingProgress}
              />
            )}
            
            <WorldInfoPanel world={world} currentArc={currentArc} />
            <EventsSection
              currentArc={currentArc}
              showEventsList={showEventsList}
              beatEvents={beatEvents}
              onToggleAddEvent={handleOpenEventModal}
            />
          </div>

          {/* Arc Tab */}
          <div className={`world-detail__section ${activeMobileTab === 'arc' ? 'world-detail__section--active' : ''}`}>
            <div className="world-detail__arc-section-mobile">
              {currentArc ? (
                <>
                  <ArcControlPanel
                    currentArc={currentArc}
                    isProgressing={isProgressing}
                    onProgressArc={handleProgressArc}
                    onAddEvent={handleOpenEventModal}
                  />
                  
                  <BeatTimeline
                    beats={beats}
                    selectedBeat={selectedBeat}
                    onBeatSelect={setSelectedBeat}
                  />
                  
                  <BeatDetails
                    selectedBeat={selectedBeat}
                    expandedBeat={expandedBeat}
                    onToggleExpanded={() => setExpandedBeat(!expandedBeat)}
                  />
                </>
              ) : (
                // Check if world is unseeded
                locations.length === 0 && factions.length === 0 && characters.length === 0 && !isLoading ? (
                  <WorldSeedingPanel
                    worldId={worldId!}
                    onSeedWorld={handleSeedWorld}
                    isSeeding={isSeeding}
                    seedingProgress={seedingProgress}
                  />
                ) : (
                  <CreateArcPanel
                    showCreateArc={showCreateArc}
                    storyIdea={storyIdea}
                    isCreating={isCreatingArc}
                    onStoryIdeaChange={setStoryIdea}
                    onToggleForm={() => setShowCreateArc(!showCreateArc)}
                    onSubmit={handleCreateArc}
                  />
                )
              )}
            </div>
          </div>

          {/* Locations Tab */}
          <div className={`world-detail__section ${activeMobileTab === 'locations' ? 'world-detail__section--active' : ''}`}>
            <LocationSection
              groupedLocations={groupedLocations}
              totalLocationCount={totalLocationCount}
              onLocationClick={handleLocationClick}
            />
          </div>

          {/* Characters Tab */}
          <div className={`world-detail__section ${activeMobileTab === 'characters' ? 'world-detail__section--active' : ''}`}>
            <FactionSection
              factions={factions}
              factionCount={factionCount}
              onFactionClick={handleFactionClick}
            />
            
            <CharacterSection
              majorCharacters={majorCharacters}
              minorCharacters={minorCharacters}
              characterCount={characterCount}
              onCharacterClick={handleCharacterClick}
            />
          </div>
        </div>

      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={showAddEvent}
        onClose={handleCloseEventModal}
        newEvent={newEvent}
        onEventChange={setNewEvent}
        onSubmit={handleRecordEvent}
      />

      {/* Entity Modals */}
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
      
    </div>
  );
}