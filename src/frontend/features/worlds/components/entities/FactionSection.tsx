import type { Faction } from '../../types';

interface FactionSectionProps {
  factions: Faction[];
  factionCount: number;
  onFactionClick: (faction: Faction) => void;
}

export function FactionSection({ factions, factionCount, onFactionClick }: FactionSectionProps) {
  return (
    <div className="world-detail__entity-section">
      <div className="world-detail__section-header">
        <h2 className="world-detail__section-title">
          <span className="material-icons">groups</span>
          Factions ({factionCount})
        </h2>
      </div>
      
      <div className="world-detail__factions-content">
        {factions.length > 0 ? (
          <ul className="world-detail__faction-list">
            {factions.map(faction => (
              <li key={faction.id} className="world-detail__faction-item" onClick={() => onFactionClick(faction)}>
                <span className={`world-detail__faction-status world-detail__faction-status--${faction.status}`}></span>
                {faction.name}
              </li>
            ))}
          </ul>
        ) : (
          <div className="world-detail__empty-message">
            No factions found for this world
          </div>
        )}
      </div>
    </div>
  );
}