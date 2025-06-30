import type { Beat } from '../../types';

interface BeatTimelineProps {
  beats: Beat[];
  selectedBeat: Beat | null;
  onBeatSelect: (beat: Beat) => void;
}

export function BeatTimeline({ beats, selectedBeat, onBeatSelect }: BeatTimelineProps) {
  return (
    <>
      {/* Beat markers on progress bar */}
      <div className="world-detail__arc-progress">
        <div className="world-detail__progress-bar-enhanced">
          <div 
            className="world-detail__progress-fill-enhanced"
            style={{ width: `${(beats.length / 15) * 100}%` }}
          >
            <div className="world-detail__progress-glow"></div>
          </div>
          {/* Beat markers */}
          {beats.map((beat, index) => (
            <div
              key={beat.id}
              className={`world-detail__beat-marker ${beat.beat_type === 'anchor' ? 'world-detail__beat-marker--anchor' : ''} ${selectedBeat?.id === beat.id ? 'world-detail__beat-marker--active' : ''}`}
              style={{ left: `${(index / 14) * 100}%` }}
              onClick={() => onBeatSelect(beat)}
              title={beat.beat_name}
            >
              <span className="world-detail__beat-marker-dot"></span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Beat Timeline (Horizontal) */}
      <div className="world-detail__beat-timeline">
        <h4 className="world-detail__timeline-title">Story Timeline</h4>
        <div className="world-detail__timeline-scroll">
          <div className="world-detail__timeline-track">
            {beats.map((beat, index) => (
              <button
                key={beat.id}
                onClick={() => onBeatSelect(beat)}
                className={`world-detail__timeline-beat ${selectedBeat?.id === beat.id ? 'world-detail__timeline-beat--active' : ''} ${beat.beat_type === 'anchor' ? 'world-detail__timeline-beat--anchor' : ''}`}
              >
                <span className="world-detail__timeline-beat-number">
                  {beat.beat_index}
                </span>
                <span className="world-detail__timeline-beat-name">
                  {beat.beat_name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}