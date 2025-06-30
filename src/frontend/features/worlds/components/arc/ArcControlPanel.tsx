import type { Arc } from '../../types';

interface ArcControlPanelProps {
  currentArc: NonNullable<Arc>;
  isProgressing: boolean;
  onProgressArc: () => void;
  onAddEvent: () => void;
}

export function ArcControlPanel({ currentArc, isProgressing, onProgressArc, onAddEvent }: ArcControlPanelProps) {
  return (
    <div className="world-detail__arc-control-panel">
      <div className="world-detail__arc-header">
        <div className="world-detail__arc-info">
          <h2 className="world-detail__arc-title">
            <span className="material-icons">auto_stories</span>
            {currentArc.story_name}
          </h2>
        </div>
        
        <div className="world-detail__arc-actions">
          <button
            onClick={onAddEvent}
            className="world-detail__add-event-button-primary"
          >
            <span className="material-icons">event_note</span>
            <span>ADD EVENT</span>
          </button>
          
          <button
            onClick={onProgressArc}
            disabled={isProgressing}
            className="world-detail__progress-button-primary"
          >
            {isProgressing ? (
              <>
                <div className="world-detail__button-spinner"></div>
                <span>Progressing Story...</span>
              </>
            ) : (
              <>
                <span className="material-icons">play_arrow</span>
                <span>PROGRESS STORY</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Arc Details Section */}
      <div className="world-detail__arc-details">
        {/* Detailed Description */}
        {currentArc.detailed_description && (
          <div className="world-detail__arc-detail-section">
            <h4 className="world-detail__arc-detail-title">Narrative Description</h4>
            <p className="world-detail__arc-detail-text">{currentArc.detailed_description}</p>
          </div>
        )}

        {/* Summary */}
        {currentArc.summary && (
          <div className="world-detail__arc-detail-section">
            <h4 className="world-detail__arc-detail-title">Arc Summary</h4>
            <p className="world-detail__arc-detail-text">{currentArc.summary}</p>
          </div>
        )}

        {/* If no detailed info is available, show a placeholder */}
        {!currentArc.detailed_description && !currentArc.summary && (
          <div className="world-detail__arc-detail-section">
            <p className="world-detail__arc-detail-placeholder">
              Arc details will be generated as the story progresses...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}