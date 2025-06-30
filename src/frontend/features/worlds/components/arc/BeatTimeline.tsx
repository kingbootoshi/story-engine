import { useState } from 'react';
import type { Beat } from '../../types';

interface BeatTimelineProps {
  beats: Beat[];
  selectedBeat: Beat | null;
  onBeatSelect: (beat: Beat) => void;
}

export function BeatTimeline({ beats, selectedBeat, onBeatSelect }: BeatTimelineProps) {
  const [hoveredBeat, setHoveredBeat] = useState<Beat | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (beat: Beat, event: React.MouseEvent) => {
    setHoveredBeat(beat);
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleMouseLeave = () => {
    setHoveredBeat(null);
  };

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
            onMouseEnter={(e) => handleMouseEnter(beat, e)}
            onMouseLeave={handleMouseLeave}
          >
            <span className="world-detail__beat-marker-dot"></span>
          </div>
        ))}
      </div>
      
      {/* Custom tooltip */}
      {hoveredBeat && (
        <div 
          className="world-detail__beat-tooltip"
          style={{
            left: mousePosition.x,
            top: mousePosition.y - 40
          }}
        >
          <span className="world-detail__beat-tooltip-index">Beat {hoveredBeat.beat_index}</span>
          <span className="world-detail__beat-tooltip-name">{hoveredBeat.beat_name}</span>
        </div>
      )}
    </div>
  );
}