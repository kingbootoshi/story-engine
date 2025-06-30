import { useState } from 'react';
import { trpc } from '@/shared/lib/trpcClient';
import type { World, Arc } from '../types';

export function useArcProgression() {
  const [isProgressing, setIsProgressing] = useState(false);
  const [showCreateArc, setShowCreateArc] = useState(false);
  const [storyIdea, setStoryIdea] = useState('');

  const createNewArc = async (
    world: World, 
    storyIdea: string,
    onSuccess: (arc: Arc) => void,
    onError: (error: string) => void
  ) => {
    if (!world) return;

    try {
      const { arc } = await trpc.world.createNewArc.mutate({
        worldId: world.id,
        worldName: world.name,
        worldDescription: world.description,
        storyIdea
      });
      
      console.debug('[useArcProgression] Created arc:', arc);
      setShowCreateArc(false);
      setStoryIdea('');
      onSuccess(arc);
    } catch (err) {
      console.error('[useArcProgression] Failed to create arc:', err);
      onError('Failed to create new arc');
    }
  };

  const progressArc = async (
    world: World,
    currentArc: Arc,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    if (!currentArc || !world) return;

    setIsProgressing(true);
    try {
      const result = await trpc.world.progressArc.mutate({
        worldId: world.id,
        arcId: currentArc.id
      });

      console.debug('[useArcProgression] Arc progressed:', result);
      
      if (!result) {
        alert('Arc is complete! You can create a new arc to continue the story.');
      }
      
      onSuccess();
    } catch (err) {
      console.error('[useArcProgression] Failed to progress arc:', err);
      onError('Failed to progress arc');
    } finally {
      setIsProgressing(false);
    }
  };

  return {
    isProgressing,
    showCreateArc,
    storyIdea,
    setShowCreateArc,
    setStoryIdea,
    createNewArc,
    progressArc
  };
}