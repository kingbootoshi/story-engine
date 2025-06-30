import { useState } from 'react';
import { trpc } from '@/shared/lib/trpcClient';
import type { WorldEvent, Beat, NewEventForm } from '../types';

export function useEventManagement() {
  const [beatEvents, setBeatEvents] = useState<WorldEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEventsList, setShowEventsList] = useState(true);
  const [newEvent, setNewEvent] = useState<NewEventForm>({
    eventType: 'player_action',
    impactLevel: 'minor',
    description: ''
  });

  const fetchBeatEvents = async (beatId: string) => {
    try {
      const events = await trpc.world.getBeatEvents.query(beatId);
      setBeatEvents(events);
    } catch (err) {
      console.error('[useEventManagement] Failed to fetch beat events:', err);
    }
  };

  const recordEvent = async (
    worldId: string,
    selectedBeat: Beat | null,
    beats: Beat[],
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    if (!worldId) return;

    try {
      if (beats.length === 0) {
        alert('No current beat to attach the event to. Generate a beat first.');
        return;
      }

      // Determine the beat to attach to – the one the user selected or the latest.
      const beat = selectedBeat ?? beats[beats.length - 1];

      await trpc.world.recordWorldEvent.mutate({
        world_id: worldId,
        event_type: newEvent.eventType,
        impact_level: newEvent.impactLevel,
        description: newEvent.description
      });
      
      console.debug('[useEventManagement] Recorded event:', {
        world_id: worldId,
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
      onSuccess();
    } catch (err) {
      console.error('[useEventManagement] Failed to record event:', err);
      onError('Failed to record event');
    }
  };

  return {
    beatEvents,
    showAddEvent,
    showEventsList,
    newEvent,
    setShowAddEvent,
    setShowEventsList,
    setNewEvent,
    fetchBeatEvents,
    recordEvent
  };
}