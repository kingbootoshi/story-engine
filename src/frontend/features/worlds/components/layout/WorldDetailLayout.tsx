import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WorldHeader } from './WorldHeader';
import { WorldInfoPanel } from './WorldInfoPanel';
import { ArcControlPanel } from '../arc/ArcControlPanel';
import { BeatTimeline } from '../arc/BeatTimeline';
import { BeatDetails } from '../arc/BeatDetails';
import { CreateArcPanel } from '../arc/CreateArcPanel';
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
import '../../styles/index.css';

export function WorldDetailLayout() {
  const { worldId } = useParams<{ worldId: string }>();
  
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
        
        {/* Create Arc Panel if no active arc */}
        {!currentArc && (
          <CreateArcPanel
            showCreateArc={showCreateArc}
            storyIdea={storyIdea}
            onStoryIdeaChange={setStoryIdea}
            onToggleForm={() => setShowCreateArc(!showCreateArc)}
            onSubmit={handleCreateArc}
          />
        )}

        {/* Unified Gamemaster Panel */}
        <div className={`world-detail__unified-panel world-detail__unified-panel--${viewDensity}`}>
          {/* Left Section - Locations */}
          <LocationSection
            groupedLocations={groupedLocations}
            totalLocationCount={totalLocationCount}
            onLocationClick={handleLocationClick}
          />

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

          {/* Right Section - Characters & Factions */}
          <div className="world-detail__section world-detail__section--entities">
            <CharacterSection
              majorCharacters={majorCharacters}
              minorCharacters={minorCharacters}
              characterCount={characterCount}
              onCharacterClick={handleCharacterClick}
            />
            
            <FactionSection
              factions={factions}
              factionCount={factionCount}
              onFactionClick={handleFactionClick}
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