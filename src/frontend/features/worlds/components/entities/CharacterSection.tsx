import type { Character } from '../../types';

interface CharacterSectionProps {
  majorCharacters: Character[];
  minorCharacters: Character[];
  characterCount: number;
  onCharacterClick: (character: Character) => void;
}

export function CharacterSection({ 
  majorCharacters, 
  minorCharacters, 
  characterCount, 
  onCharacterClick 
}: CharacterSectionProps) {
  return (
    <div className="world-detail__entity-section">
      <div className="world-detail__section-header">
        <h2 className="world-detail__section-title">
          <span className="material-icons">person</span>
          Characters ({characterCount})
        </h2>
        {characterCount > 8 && (
          <span className="world-detail__scroll-hint" title="Scroll to see more">
            <span className="material-icons">unfold_more</span>
          </span>
        )}
      </div>
      
      <div className="world-detail__characters-content">
        {(majorCharacters.length > 0 || minorCharacters.length > 0) ? (
          <>
            {/* Major Characters */}
            <div className="world-detail__character-group">
              <h3 className="world-detail__character-group-title">
                Major Characters ({majorCharacters.length})
              </h3>
              <ul className="world-detail__character-list">
                {majorCharacters.map(character => (
                  <li key={character.id} className="world-detail__character-item" onClick={() => onCharacterClick(character)}>
                    <span className={`world-detail__character-status world-detail__character-status--${character.status}`}></span>
                    {character.name}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Minor Characters */}
            <div className="world-detail__character-group">
              <h3 className="world-detail__character-group-title">
                Minor Characters ({minorCharacters.length})
              </h3>
              <ul className="world-detail__character-list">
                {minorCharacters.map(character => (
                  <li key={character.id} className="world-detail__character-item" onClick={() => onCharacterClick(character)}>
                    <span className={`world-detail__character-status world-detail__character-status--${character.status}`}></span>
                    {character.name}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="world-detail__empty-message">
            No characters found for this world
          </div>
        )}
      </div>
    </div>
  );
}