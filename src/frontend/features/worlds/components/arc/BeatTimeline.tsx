import type { Beat } from '../../types';

interface BeatTimelineProps {
  beats: Beat[];
  selectedBeat: Beat | null;
  onBeatSelect: (beat: Beat) => void;
}

export function BeatTimeline({ beats, selectedBeat, onBeatSelect }: BeatTimelineProps) {
  return (
    <div className="world-detail__arc-progress">
      <div className="world-detail__progress-bar-enhanced">
        <div 
          className="world-detail__progress-fill-enhanced"
          style={{ width: `${(beats.length / 15) * 100}%` }}
        >
          <div className="world-detail__progress-glow"></div>
        </div>
        {/* Beat markers - clickable circles with hover tooltips */}
        {beats.map((beat, index) => (
          <div
            key={beat.id}
            className={`world-detail__beat-marker ${beat.beat_type === 'anchor' ? 'world-detail__beat-marker--anchor' : ''} ${selectedBeat?.id === beat.id ? 'world-detail__beat-marker--active' : ''}`}
            style={{ left: `${(index / 14) * 100}%` }}
            onClick={() => onBeatSelect(beat)}
            title={`Beat ${beat.beat_index}: ${beat.beat_name}`}
          >
            <span className="world-detail__beat-marker-dot"></span>
          </div>
        ))}
      </div>
    </div>
  );
}