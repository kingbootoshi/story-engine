import type { WorldEvent } from '../../types';

interface EventListProps {
  events: WorldEvent[];
  isVisible: boolean;
}

export function EventList({ events, isVisible }: EventListProps) {
  if (!isVisible) return null;

  return (
    <div className="world-detail__events-list">
      {events.length === 0 ? (
        <div className="world-detail__events-empty">
          No events recorded yet
        </div>
      ) : (
        events.map((event) => (
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
  );
}