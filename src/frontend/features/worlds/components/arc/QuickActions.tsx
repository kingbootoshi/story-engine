import type { ViewDensity } from '../../types';

interface QuickActionsProps {
  viewDensity: ViewDensity;
  onViewDensityChange: (density: ViewDensity) => void;
}

export function QuickActions({
  viewDensity,
  onViewDensityChange
}: QuickActionsProps) {
  return (
    <div className="world-detail__quick-actions">
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