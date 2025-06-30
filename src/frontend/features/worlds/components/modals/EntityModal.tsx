import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './EntityModal.styles.css';

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function EntityModal({ isOpen, onClose, title, children }: EntityModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add('modal-open');
      
      return () => {
        // Restore scroll position
        document.body.classList.remove('modal-open');
        const savedScrollY = document.body.style.top;
        document.body.style.top = '';
        window.scrollTo(0, parseInt(savedScrollY || '0') * -1);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="entity-modal-overlay" onClick={handleOverlayClick}>
      <div className="entity-modal">
        <div className="entity-modal__header">
          <h2 className="entity-modal__title">{title}</h2>
          <button
            onClick={onClose}
            className="entity-modal__close"
            aria-label="Close modal"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="entity-modal__content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Location Modal - Updated to show all fields
interface LocationModalProps {
  location: {
    id: string;
    world_id: string;
    parent_location_id: string | null;
    name: string;
    type: string;
    status: string;
    description: string;
    tags: string[];
    relative_x: number | null;
    relative_y: number | null;
    controlling_faction_id?: string | null;
    historical_events: Array<{
      timestamp: string;
      event: string;
      previous_status?: string;
      beat_index?: number;
    }>;
    /**
     * Timestamp of the last meaningful change to this location.
     * Optional because freshly generated locations have no change history yet.
     */
    last_significant_change?: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ location, isOpen, onClose }: LocationModalProps) {
  if (!location) return null;

  return (
    <EntityModal isOpen={isOpen} onClose={onClose} title={location.name}>
      <div className="entity-modal__section">
        <h3 className="entity-modal__section-title">Basic Information</h3>
        <div className="entity-modal__info-grid">
          <div className="entity-modal__info-item">
            <span className="entity-modal__info-label">Type:</span>
            <span className="entity-modal__info-value">{location.type}</span>
          </div>
          <div className="entity-modal__info-item">
            <span className="entity-modal__info-label">Status:</span>
            <span className={`entity-modal__status entity-modal__status--${location.status}`}>
              {location.status}
            </span>
          </div>
          {location.relative_x !== null && location.relative_y !== null && (
            <div className="entity-modal__info-item">
              <span className="entity-modal__info-label">Coordinates:</span>
              <span className="entity-modal__info-value">({location.relative_x}, {location.relative_y})</span>
            </div>
          )}
        </div>
      </div>

      {location.description && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Description</h3>
          <p className="entity-modal__text">{location.description}</p>
        </div>
      )}

      {location.tags && location.tags.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Tags</h3>
          <ul className="entity-modal__list">
            {location.tags.map((tag, index) => (
              <li key={index} className="entity-modal__list-item">{tag}</li>
            ))}
          </ul>
        </div>
      )}

      {location.historical_events && location.historical_events.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Historical Events</h3>
          <ul className="entity-modal__list">
            {location.historical_events.map((event, index) => (
              <li key={index} className="entity-modal__list-item">
                <strong>{new Date(event.timestamp).toLocaleDateString()}</strong>: {event.event}
                {event.previous_status && ` (Previously: ${event.previous_status})`}
                {event.beat_index !== undefined && ` [Beat ${event.beat_index}]`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="entity-modal__meta">
        <span className="entity-modal__meta-text">
          Created {new Date(location.created_at).toLocaleDateString()}
          {location.last_significant_change && ` • Last change: ${new Date(location.last_significant_change).toLocaleDateString()}`}
        </span>
      </div>
    </EntityModal>
  );
}

// Character Modal - Updated to show all fields
interface CharacterModalProps {
  character: {
    id: string;
    world_id: string;
    name: string;
    type: 'player' | 'npc';
    status: 'alive' | 'deceased';
    story_role: string;
    description: string;
    background: string;
    personality_traits: string[];
    motivations: string[];
    location_id: string | null;
    faction_id: string | null;
    memories: Array<{
      event_description: string;
      timestamp: string;
      emotional_impact: 'positive' | 'negative' | 'neutral';
      importance: number;
      beat_index?: number;
    }>;
    story_beats_witnessed: number[];
    created_at: string;
    updated_at: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CharacterModal({ character, isOpen, onClose }: CharacterModalProps) {
  if (!character) return null;

  return (
    <EntityModal isOpen={isOpen} onClose={onClose} title={character.name}>
      <div className="entity-modal__section">
        <h3 className="entity-modal__section-title">Basic Information</h3>
        <div className="entity-modal__info-grid">
          <div className="entity-modal__info-item">
            <span className="entity-modal__info-label">Type:</span>
            <span className="entity-modal__info-value">{character.type.toUpperCase()}</span>
          </div>
          <div className="entity-modal__info-item">
            <span className="entity-modal__info-label">Role:</span>
            <span className="entity-modal__info-value">{character.story_role}</span>
          </div>
          <div className="entity-modal__info-item">
            <span className="entity-modal__info-label">Status:</span>
            <span className={`entity-modal__status entity-modal__status--${character.status}`}>
              {character.status}
            </span>
          </div>
          {character.story_beats_witnessed && character.story_beats_witnessed.length > 0 && (
            <div className="entity-modal__info-item">
              <span className="entity-modal__info-label">Story Progress:</span>
              <span className="entity-modal__info-value">Witnessed {character.story_beats_witnessed.length} beats</span>
            </div>
          )}
        </div>
      </div>

      {character.description && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Description</h3>
          <p className="entity-modal__text">{character.description}</p>
        </div>
      )}

      {character.background && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Background</h3>
          <p className="entity-modal__text">{character.background}</p>
        </div>
      )}

      {character.personality_traits && character.personality_traits.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Personality Traits</h3>
          <ul className="entity-modal__list">
            {character.personality_traits.map((trait, index) => (
              <li key={index} className="entity-modal__list-item">{trait}</li>
            ))}
          </ul>
        </div>
      )}

      {character.motivations && character.motivations.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Motivations</h3>
          <ul className="entity-modal__list">
            {character.motivations.map((motivation, index) => (
              <li key={index} className="entity-modal__list-item">{motivation}</li>
            ))}
          </ul>
        </div>
      )}

      {character.memories && character.memories.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Memories</h3>
          <ul className="entity-modal__list">
            {character.memories.map((memory, index) => (
              <li key={index} className="entity-modal__list-item">
                <strong>{new Date(memory.timestamp).toLocaleDateString()}</strong>: {memory.event_description}
                <br />
                <small>Impact: {memory.emotional_impact} • Importance: {(memory.importance * 100).toFixed(0)}%</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="entity-modal__meta">
        <span className="entity-modal__meta-text">
          Created {new Date(character.created_at).toLocaleDateString()}
        </span>
      </div>
    </EntityModal>
  );
}

// Faction Modal - Updated to show all fields
interface FactionModalProps {
  faction: {
    id: string;
    world_id: string;
    name: string;
    banner_color: string | null;
    emblem_svg: string | null;
    ideology: string;
    status: 'rising' | 'stable' | 'declining' | 'collapsed';
    members_estimate: number;
    home_location_id: string | null;
    controlled_locations: string[];
    tags: string[];
    historical_events: Array<{
      timestamp: string;
      event: string;
    }>;
    created_at: string;
    updated_at: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FactionModal({ faction, isOpen, onClose }: FactionModalProps) {
  if (!faction) return null;

  return (
    <EntityModal isOpen={isOpen} onClose={onClose} title={faction.name}>
      <div className="entity-modal__section">
        <h3 className="entity-modal__section-title">Basic Information</h3>
        <div className="entity-modal__info-grid">
          <div className="entity-modal__info-item">
            <span className="entity-modal__info-label">Status:</span>
            <span className={`entity-modal__status entity-modal__status--${faction.status}`}>
              {faction.status}
            </span>
          </div>
          <div className="entity-modal__info-item">
            <span className="entity-modal__info-label">Members:</span>
            <span className="entity-modal__info-value">{faction.members_estimate.toLocaleString()}</span>
          </div>
          {faction.controlled_locations && faction.controlled_locations.length > 0 && (
            <div className="entity-modal__info-item">
              <span className="entity-modal__info-label">Controlled Locations:</span>
              <span className="entity-modal__info-value">{faction.controlled_locations.length}</span>
            </div>
          )}
          {faction.banner_color && (
            <div className="entity-modal__info-item">
              <span className="entity-modal__info-label">Banner Color:</span>
              <span className="entity-modal__info-value">
                <span 
                  style={{ 
                    display: 'inline-block', 
                    width: '16px', 
                    height: '16px', 
                    backgroundColor: faction.banner_color,
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '2px',
                    verticalAlign: 'middle',
                    marginRight: '8px'
                  }}
                ></span>
                {faction.banner_color}
              </span>
            </div>
          )}
        </div>
      </div>

      {faction.ideology && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Ideology</h3>
          <p className="entity-modal__text">{faction.ideology}</p>
        </div>
      )}

      {faction.tags && faction.tags.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Tags</h3>
          <ul className="entity-modal__list">
            {faction.tags.map((tag, index) => (
              <li key={index} className="entity-modal__list-item">{tag}</li>
            ))}
          </ul>
        </div>
      )}

      {faction.historical_events && faction.historical_events.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Historical Events</h3>
          <ul className="entity-modal__list">
            {faction.historical_events.map((event, index) => (
              <li key={index} className="entity-modal__list-item">
                <strong>{new Date(event.timestamp).toLocaleDateString()}</strong>: {event.event}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="entity-modal__meta">
        <span className="entity-modal__meta-text">
          Created {new Date(faction.created_at).toLocaleDateString()}
        </span>
      </div>
    </EntityModal>
  );
}