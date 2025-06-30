import type { ViewDensity } from '../../types';

interface QuickActionsProps {
  showEventsList: boolean;
  viewDensity: ViewDensity;
  onToggleAddEvent: () => void;
  onToggleEventsList: () => void;
  onViewDensityChange: (density: ViewDensity) => void;
}

export function QuickActions({
  showEventsList,
  viewDensity,
  onToggleAddEvent,
  onToggleEventsList,
  onViewDensityChange
}: QuickActionsProps) {
  return (
    <div className="world-detail__quick-actions">
      <button
        onClick={onToggleAddEvent}
        className="world-detail__quick-action"
      >
        <span className="material-icons">add_circle</span>
        Add Event
      </button>
      <button
        onClick={onToggleEventsList}
        className="world-detail__quick-action"
      >
        <span className="material-icons">{showEventsList ? 'visibility_off' : 'visibility'}</span>
        {showEventsList ? 'Hide' : 'Show'} Events
      </button>
      <div className="world-detail__density-toggle">
        <button
          onClick={() => onViewDensityChange('compact')}
          className={`world-detail__density-option ${viewDensity === 'compact' ? 'world-detail__density-option--active' : ''}`}
          title="Compact View"
        >
          <span className="material-icons">view_agenda</span>
        </button>
        <button
          onClick={() => onViewDensityChange('standard')}
          className={`world-detail__density-option ${viewDensity === 'standard' ? 'world-detail__density-option--active' : ''}`}
          title="Standard View"
        >
          <span className="material-icons">view_module</span>
        </button>
        <button
          onClick={() => onViewDensityChange('detailed')}
          className={`world-detail__density-option ${viewDensity === 'detailed' ? 'world-detail__density-option--active' : ''}`}
          title="Detailed View"
        >
          <span className="material-icons">view_comfy</span>
        </button>
      </div>
    </div>
  );
}