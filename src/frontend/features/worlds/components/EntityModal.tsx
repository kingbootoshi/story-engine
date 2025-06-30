import { useState } from 'react';
import './EntityModal.styles.css';

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function EntityModal({ isOpen, onClose, title, children }: EntityModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
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
    </div>
  );
}

// Location Modal
interface LocationModalProps {
  location: {
    id: string;
    name: string;
    type: string;
    status: string;
    description?: string;
    population?: number;
    notable_features?: string[];
    key_npcs?: string[];
    political_influence?: string;
    created_at: string;
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
          {location.population && (
            <div className="entity-modal__info-item">
              <span className="entity-modal__info-label">Population:</span>
              <span className="entity-modal__info-value">{location.population.toLocaleString()}</span>
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

      {location.notable_features && location.notable_features.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Notable Features</h3>
          <ul className="entity-modal__list">
            {location.notable_features.map((feature, index) => (
              <li key={index} className="entity-modal__list-item">{feature}</li>
            ))}
          </ul>
        </div>
      )}

      {location.key_npcs && location.key_npcs.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Key NPCs</h3>
          <ul className="entity-modal__list">
            {location.key_npcs.map((npc, index) => (
              <li key={index} className="entity-modal__list-item">{npc}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="entity-modal__meta">
        <span className="entity-modal__meta-text">
          Created {new Date(location.created_at).toLocaleDateString()}
        </span>
      </div>
    </EntityModal>
  );
}

// Character Modal
interface CharacterModalProps {
  character: {
    id: string;
    name: string;
    story_role: string;
    status: string;
    description?: string;
    background?: string;
    motivations?: string[];
    relationships?: string[];
    current_location?: string;
    created_at: string;
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
            <span className="entity-modal__info-label">Role:</span>
            <span className="entity-modal__info-value">{character.story_role}</span>
          </div>
          <div className="entity-modal__info-item">
            <span className="entity-modal__info-label">Status:</span>
            <span className={`entity-modal__status entity-modal__status--${character.status}`}>
              {character.status}
            </span>
          </div>
          {character.current_location && (
            <div className="entity-modal__info-item">
              <span className="entity-modal__info-label">Location:</span>
              <span className="entity-modal__info-value">{character.current_location}</span>
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

      {character.relationships && character.relationships.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Relationships</h3>
          <ul className="entity-modal__list">
            {character.relationships.map((relationship, index) => (
              <li key={index} className="entity-modal__list-item">{relationship}</li>
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

// Faction Modal
interface FactionModalProps {
  faction: {
    id: string;
    name: string;
    type: string;
    status: string;
    description?: string;
    goals?: string[];
    resources?: string[];
    key_members?: string[];
    territory?: string;
    created_at: string;
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
            <span className="entity-modal__info-label">Type:</span>
            <span className="entity-modal__info-value">{faction.type}</span>
          </div>
          <div className="entity-modal__info-item">
            <span className="entity-modal__info-label">Status:</span>
            <span className={`entity-modal__status entity-modal__status--${faction.status}`}>
              {faction.status}
            </span>
          </div>
          {faction.territory && (
            <div className="entity-modal__info-item">
              <span className="entity-modal__info-label">Territory:</span>
              <span className="entity-modal__info-value">{faction.territory}</span>
            </div>
          )}
        </div>
      </div>

      {faction.description && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Description</h3>
          <p className="entity-modal__text">{faction.description}</p>
        </div>
      )}

      {faction.goals && faction.goals.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Goals</h3>
          <ul className="entity-modal__list">
            {faction.goals.map((goal, index) => (
              <li key={index} className="entity-modal__list-item">{goal}</li>
            ))}
          </ul>
        </div>
      )}

      {faction.resources && faction.resources.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Resources</h3>
          <ul className="entity-modal__list">
            {faction.resources.map((resource, index) => (
              <li key={index} className="entity-modal__list-item">{resource}</li>
            ))}
          </ul>
        </div>
      )}

      {faction.key_members && faction.key_members.length > 0 && (
        <div className="entity-modal__section">
          <h3 className="entity-modal__section-title">Key Members</h3>
          <ul className="entity-modal__list">
            {faction.key_members.map((member, index) => (
              <li key={index} className="entity-modal__list-item">{member}</li>
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