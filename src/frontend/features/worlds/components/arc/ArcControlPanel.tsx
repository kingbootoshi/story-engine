import type { Arc, Beat } from '../../types';

interface ArcControlPanelProps {
  currentArc: Arc;
  beats: Beat[];
  isProgressing: boolean;
  onProgressArc: () => void;
}

export function ArcControlPanel({ currentArc, beats, isProgressing, onProgressArc }: ArcControlPanelProps) {
  return (
    <div className="world-detail__arc-control-panel">
      <div className="world-detail__arc-header">
        <div className="world-detail__arc-info">
          <h2 className="world-detail__arc-title">
            <span className="material-icons">auto_stories</span>
            {currentArc.story_name}
          </h2>
          <span className="world-detail__arc-status-badge">
            Arc #{currentArc.arc_number} • {currentArc.status}
          </span>
        </div>
        
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
      
      {/* Progress Bar with Beat Markers */}
      <div className="world-detail__arc-progress">
        <div className="world-detail__progress-bar-enhanced">
          <div 
            className="world-detail__progress-fill-enhanced"
            style={{ width: `${(beats.length / 15) * 100}%` }}
          >
            <div className="world-detail__progress-glow"></div>
          </div>
        </div>
      </div>
    </div>
  );
}