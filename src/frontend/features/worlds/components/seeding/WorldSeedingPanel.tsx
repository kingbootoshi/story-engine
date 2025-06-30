import { useState } from 'react';
import './WorldSeedingPanel.styles.css';

interface WorldSeedingPanelProps {
  worldId: string;
  onSeedWorld: () => void;
  isSeeding: boolean;
  seedingProgress?: {
    phase: 'locations' | 'factions' | 'characters';
    status: 'started' | 'completed';
    message: string;
    count?: number;
  };
}

export function WorldSeedingPanel({ 
  worldId, 
  onSeedWorld, 
  isSeeding,
  seedingProgress 
}: WorldSeedingPanelProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSeedClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onSeedWorld();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (isSeeding) {
    return (
      <div className="world-seeding-panel world-seeding-panel--progress">
        <div className="world-seeding-panel__header">
          <h2 className="world-seeding-panel__title">Seeding Your World</h2>
          <p className="world-seeding-panel__subtitle">
            Your world is being populated with AI-generated content...
          </p>
        </div>

        <div className="world-seeding-panel__progress">
          {/* Animated magical orb */}
          <div className="world-seeding-panel__orb-container">
            <div className="world-seeding-panel__orb">
              <div className="world-seeding-panel__orb-core"></div>
              <div className="world-seeding-panel__particles">
                <span className="world-seeding-panel__particle"></span>
                <span className="world-seeding-panel__particle"></span>
                <span className="world-seeding-panel__particle"></span>
                <span className="world-seeding-panel__particle"></span>
              </div>
            </div>
          </div>

          <div className="world-seeding-panel__phases">
            <div className={`world-seeding-panel__phase ${
              seedingProgress?.phase === 'locations' ? 'world-seeding-panel__phase--active' : ''
            } ${
              seedingProgress?.phase === 'factions' || seedingProgress?.phase === 'characters' 
                ? 'world-seeding-panel__phase--complete' : ''
            }`}>
              <span className="material-icons world-seeding-panel__phase-icon">place</span>
              <span className="world-seeding-panel__phase-name">Locations</span>
            </div>

            <div className={`world-seeding-panel__phase ${
              seedingProgress?.phase === 'factions' ? 'world-seeding-panel__phase--active' : ''
            } ${
              seedingProgress?.phase === 'characters' ? 'world-seeding-panel__phase--complete' : ''
            }`}>
              <span className="material-icons world-seeding-panel__phase-icon">groups</span>
              <span className="world-seeding-panel__phase-name">Factions</span>
            </div>

            <div className={`world-seeding-panel__phase ${
              seedingProgress?.phase === 'characters' ? 'world-seeding-panel__phase--active' : ''
            }`}>
              <span className="material-icons world-seeding-panel__phase-icon">person</span>
              <span className="world-seeding-panel__phase-name">Characters</span>
            </div>
          </div>

          {seedingProgress && (
            <div className="world-seeding-panel__status">
              <p className="world-seeding-panel__message">{seedingProgress.message}</p>
              {seedingProgress.count !== undefined && (
                <p className="world-seeding-panel__count">Created: {seedingProgress.count}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="world-seeding-panel">
      <div className="world-seeding-panel__header">
        <h2 className="world-seeding-panel__title">Welcome to Your New World</h2>
        <p className="world-seeding-panel__subtitle">
          Your world is currently empty. Choose how you'd like to populate it:
        </p>
      </div>

      <div className="world-seeding-panel__options">
        <div className="world-seeding-panel__option world-seeding-panel__option--ai">
          <span className="material-icons world-seeding-panel__option-icon">auto_awesome</span>
          <h3 className="world-seeding-panel__option-title">AI World Generation</h3>
          <p className="world-seeding-panel__option-description">
            Let our AI create a rich, interconnected world with regions, cities, factions, and characters.
            Perfect for getting started quickly with a fully-realized setting.
          </p>
          <button 
            className="world-seeding-panel__button world-seeding-panel__button--primary"
            onClick={handleSeedClick}
          >
            Generate World with AI
          </button>
        </div>

        <div className="world-seeding-panel__option world-seeding-panel__option--manual">
          <span className="material-icons world-seeding-panel__option-icon">edit</span>
          <h3 className="world-seeding-panel__option-title">Manual Creation</h3>
          <p className="world-seeding-panel__option-description">
            Build your world piece by piece. Add locations, factions, and characters exactly as you envision them.
            Ideal for precise control over your world's details.
          </p>
          <button 
            className="world-seeding-panel__button world-seeding-panel__button--secondary"
            disabled
          >
            Coming Soon
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="world-seeding-panel__confirm">
          <div className="world-seeding-panel__confirm-content">
            <h3 className="world-seeding-panel__confirm-title">Generate World with AI?</h3>
            <p className="world-seeding-panel__confirm-text">
              This will create approximately:
            </p>
            <ul className="world-seeding-panel__confirm-list">
              <li>3-5 major regions</li>
              <li>25-40 unique locations</li>
              <li>2-4 competing factions</li>
              <li>15-30 diverse characters</li>
            </ul>
            <p className="world-seeding-panel__confirm-text">
              This process typically takes 30-60 seconds.
            </p>
            <div className="world-seeding-panel__confirm-actions">
              <button 
                className="world-seeding-panel__button world-seeding-panel__button--primary"
                onClick={handleConfirm}
              >
                Start Generation
              </button>
              <button 
                className="world-seeding-panel__button world-seeding-panel__button--secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}