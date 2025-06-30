import { EventList } from './EventList';
import type { Arc, WorldEvent } from '../../types';

interface EventsSectionProps {
  currentArc: Arc | null;
  showEventsList: boolean;
  beatEvents: WorldEvent[];
  onToggleAddEvent: () => void;
}

export function EventsSection({
  currentArc,
  showEventsList,
  beatEvents,
  onToggleAddEvent
}: EventsSectionProps) {
  return (
    <div className="world-detail__events-section">
      <div className="world-detail__section-header">
        <h2 className="world-detail__section-title">
          <span className="material-icons">event_note</span>
          World Events
        </h2>
        {currentArc && (
          <button
            onClick={onToggleAddEvent}
            className="world-detail__add-button"
          >
            <span className="material-icons">add</span>
            Add Event
          </button>
        )}
      </div>

      <EventList events={beatEvents} isVisible={showEventsList} />
    </div>
  );
}