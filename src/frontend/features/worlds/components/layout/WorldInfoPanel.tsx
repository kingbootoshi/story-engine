import { WorldSphere } from '../WorldSphere';
import type { World, Arc } from '../../types';

interface WorldInfoPanelProps {
  world: World;
  currentArc: Arc | null;
}

export function WorldInfoPanel({ world, currentArc: _currentArc }: WorldInfoPanelProps) {
  return (
    <div className="world-detail__world-info">
      <h1 className="world-detail__title">{world.name}</h1>
      <p className="world-detail__description">{world.description}</p>
      
      {/* World Sphere */}
      <div className="world-detail__sphere-container">
        <WorldSphere seed={world.id} size={200} className="world-detail__sphere" />
      </div>
    </div>
  );
}