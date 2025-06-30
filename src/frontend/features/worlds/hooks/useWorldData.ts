import { useState, useEffect } from 'react';
import { trpc } from '@/shared/lib/trpcClient';
import type { World, Arc, Beat, WorldEvent } from '../types';

export function useWorldData(worldId: string | undefined) {
  const [world, setWorld] = useState<World | null>(null);
  const [currentArc, setCurrentArc] = useState<Arc | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchWorldDetails = async () => {
    if (!worldId) {
      setError('No world ID provided');
      setIsLoading(false);
      return;
    }
    
    try {
      const worldState = await trpc.world.getWorldState.query(worldId);
      console.debug('[useWorldData] Loaded world state', {
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
          console.debug('[useWorldData] Found current beat', {
            beatId: currentBeat.id,
            beatIndex: currentBeat.beat_index,
            beatName: currentBeat.beat_name
          });
          setSelectedBeat(currentBeat);
        }
      }
    } catch (err) {
      console.error('[useWorldData] Failed to fetch world:', err);
      setError('Failed to load world details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (worldId) {
      fetchWorldDetails();
    } else {
      setError('No world ID provided');
      setIsLoading(false);
    }
  }, [worldId]);

  return {
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
  };
}