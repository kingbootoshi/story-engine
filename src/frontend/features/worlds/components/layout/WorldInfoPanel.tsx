import { WorldSphere } from '../WorldSphere';
import type { World, Arc } from '../../types';

interface WorldInfoPanelProps {
  world: World;
  currentArc: Arc | null;
}

export function WorldInfoPanel({ world, currentArc }: WorldInfoPanelProps) {
  return (
    <div className="world-detail__world-info">
      <h1 className="world-detail__title">{world.name}</h1>
      <p className="world-detail__description">{world.description}</p>
      <div className="world-detail__meta">
        Created {new Date(world.created_at).toLocaleDateString()}
      </div>
      
      {/* World Sphere */}
      <div className="world-detail__sphere-container">
        <WorldSphere seed={world.id} size={200} className="world-detail__sphere" />
        
        {/* Current Arc Status */}
        <div className="world-detail__arc-status">
          {currentArc ? (
            <div className="world-detail__arc-badge">
              <span className="material-icons">auto_stories</span>
              Active Arc
            </div>
          ) : (
            <div className="world-detail__arc-badge world-detail__arc-badge--inactive">
              <span className="material-icons">auto_stories</span>
              No Active Arc
            </div>
          )}
        </div>
      </div>
    </div>
  );
}