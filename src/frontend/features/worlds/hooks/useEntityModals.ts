import { useState } from 'react';
import type { Location, Character, Faction } from '../types';

export function useEntityModals() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isFactionModalOpen, setIsFactionModalOpen] = useState(false);

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

  return {
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
  };
}