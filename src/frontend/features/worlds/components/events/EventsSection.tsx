import { EventForm } from './EventForm';
import { EventList } from './EventList';
import type { Arc, NewEventForm, WorldEvent } from '../../types';

interface EventsSectionProps {
  currentArc: Arc | null;
  showAddEvent: boolean;
  showEventsList: boolean;
  newEvent: NewEventForm;
  beatEvents: WorldEvent[];
  onToggleAddEvent: () => void;
  onEventChange: (event: NewEventForm) => void;
  onSubmitEvent: (e: React.FormEvent) => void;
}

export function EventsSection({
  currentArc,
  showAddEvent,
  showEventsList,
  newEvent,
  beatEvents,
  onToggleAddEvent,
  onEventChange,
  onSubmitEvent
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

      {showAddEvent && (
        <EventForm
          newEvent={newEvent}
          onEventChange={onEventChange}
          onSubmit={onSubmitEvent}
          onCancel={onToggleAddEvent}
        />
      )}

      <EventList events={beatEvents} isVisible={showEventsList} />
    </div>
  );
}