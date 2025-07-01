import { useSound } from '@/features/audio';
import type { NewEventForm } from '../../types';

interface EventFormProps {
  newEvent: NewEventForm;
  onEventChange: (event: NewEventForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function EventForm({ newEvent, onEventChange, onSubmit, onCancel }: EventFormProps) {
  const { play } = useSound();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    play('add_event');
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="world-detail__form-group">
        <label htmlFor="eventType">
          Event Type
        </label>
        <select
          id="eventType"
          value={newEvent.eventType}
          onChange={(e) => onEventChange({ ...newEvent, eventType: e.target.value as any })}
        >
          <option value="player_action">Player Action</option>
          <option value="world_event">World Event</option>
          <option value="system_event">System Event</option>
        </select>
      </div>

      <div className="world-detail__form-group">
        <label htmlFor="impactLevel">
          Impact Level
        </label>
        <select
          id="impactLevel"
          value={newEvent.impactLevel}
          onChange={(e) => onEventChange({ ...newEvent, impactLevel: e.target.value as any })}
        >
          <option value="minor">Minor</option>
          <option value="moderate">Moderate</option>
          <option value="major">Major</option>
        </select>
      </div>

      <div className="world-detail__form-group">
        <label htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          value={newEvent.description}
          onChange={(e) => onEventChange({ ...newEvent, description: e.target.value })}
          required
          placeholder="Describe what happened..."
          rows={4}
        />
      </div>

      <div className="world-detail__form-actions">
        <button type="submit" className="world-detail__submit-button">
          Add Event
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          className="world-detail__cancel-button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}