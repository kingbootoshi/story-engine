import type { Beat } from '../../types';

interface BeatDetailsProps {
  selectedBeat: Beat | null;
  expandedBeat: boolean;
  onToggleExpanded: () => void;
}

export function BeatDetails({ selectedBeat, expandedBeat, onToggleExpanded }: BeatDetailsProps) {
  return (
    <div className="world-detail__current-beat-summary">
      {selectedBeat ? (
        <>
          <div className="world-detail__beat-summary-header">
            <h3 className="world-detail__beat-summary-title">
              Current Beat: {selectedBeat.beat_name}
              {selectedBeat.beat_type === 'anchor' && (
                <span className="world-detail__beat-type-badge">Anchor</span>
              )}
            </h3>
            <button
              onClick={onToggleExpanded}
              className="world-detail__expand-button"
            >
              <span className="material-icons">
                {expandedBeat ? 'expand_less' : 'expand_more'}
              </span>
              {expandedBeat ? 'Show Less' : 'Show More'}
            </button>
          </div>
          
          <p className="world-detail__beat-summary-description">
            {selectedBeat.description}
          </p>
          
          {expandedBeat && (
            <div className="world-detail__beat-expanded">
              <div className="world-detail__beat-details-grid">
                <div className="world-detail__beat-directives">
                  <h4>World Directives</h4>
                  {selectedBeat.world_directives.length === 0 ? (
                    <p className="world-detail__beat-empty">None</p>
                  ) : (
                    <ul>
                      {selectedBeat.world_directives.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="world-detail__beat-storylines">
                  <h4>Emergent Storylines</h4>
                  {selectedBeat.emergent_storylines.length === 0 ? (
                    <p className="world-detail__beat-empty">None</p>
                  ) : (
                    <ul>
                      {selectedBeat.emergent_storylines.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="world-detail__beat-empty-state">
          No beat generated yet. Click "Progress Story" to begin!
        </p>
      )}
    </div>
  );
}