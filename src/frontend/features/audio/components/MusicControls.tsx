import React from 'react';
import { useAudio } from '../AudioProvider';
import './MusicControls.styles.css';

interface MusicControlsProps {
  /**
   * Variant of the controls - 'desktop' for fixed positioning, 'mobile' for inline
   */
  variant?: 'desktop' | 'mobile';
}

/**
 * Music control component that provides UI for background music
 * Allows users to toggle playback and adjust volume
 * 
 * @param {MusicControlsProps} props - Component props
 * @returns {JSX.Element} Music control UI component
 */
export const MusicControls: React.FC<MusicControlsProps> = ({ variant = 'desktop' }) => {
  const { isPlaying, volume, togglePlayback, setVolume } = useAudio();

  /**
   * Handle volume slider change
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event
   */
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
  };

  // Calculate volume percentage for visual feedback
  const volumePercentage = Math.round(volume * 100);

  return (
    <div className={`music-controls ${variant === 'mobile' ? 'music-controls--mobile' : ''}`}>
      <button
        className={`music-controls__toggle ${isPlaying ? 'playing' : ''}`}
        onClick={togglePlayback}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
        title={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? (
          // Pause icon
          <svg className="music-controls__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          // Play icon
          <svg className="music-controls__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="music-controls__volume">
        {/* Volume icon */}
        <svg className="music-controls__volume-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
        
        <input
          type="range"
          className="music-controls__slider"
          min="0"
          max="0.2"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Volume control"
          style={{ '--volume-percentage': `${volumePercentage * 5}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}; 