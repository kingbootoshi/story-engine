import { useState, useEffect } from 'react';
import { trpc } from '@/shared/lib/trpcClient';
import type { Location, Character, Faction, GroupedLocations } from '../types';

export function useEntityData(worldId: string | undefined) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [groupedLocations, setGroupedLocations] = useState<GroupedLocations>({});
  const [majorCharacters, setMajorCharacters] = useState<Character[]>([]);
  const [minorCharacters, setMinorCharacters] = useState<Character[]>([]);

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
      }, {} as GroupedLocations);
      setGroupedLocations(locationsByType);
      
      // Separate characters by story_role
      setMajorCharacters(charactersData.filter(c => c.story_role === 'major'));
      setMinorCharacters(charactersData.filter(c => 
        c.story_role === 'minor' || c.story_role === 'wildcard'
      ));
    } catch (err) {
      console.error('[useEntityData] Failed to fetch world data:', err);
      // Don't set error state here to avoid blocking the main world view
    }
  };

  useEffect(() => {
    if (worldId) {
      fetchAllWorldData();
    }
  }, [worldId]);

  return {
    locations,
    characters,
    factions,
    groupedLocations,
    majorCharacters,
    minorCharacters,
    fetchAllWorldData
  };
}