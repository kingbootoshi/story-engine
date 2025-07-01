import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { SoundEffectsManager } from './SoundEffectsManager';
import type { SoundManager } from './types';

/**
 * Audio context type definition
 * Provides methods to control background music playback and sound effects
 */
interface AudioContextType {
  // Background music controls
  isPlaying: boolean;
  volume: number;
  togglePlayback: () => void;
  setVolume: (volume: number) => void;
  
  // Sound effects controls
  soundManager: SoundManager | null;
  soundVolume: number;
  isSoundMuted: boolean;
  setSoundVolume: (volume: number) => void;
  toggleSoundMute: () => void;
}

/**
 * Create the audio context with default values
 */
export const AudioContext = createContext<AudioContextType | undefined>(undefined);

/**
 * Audio provider props
 */
interface AudioProviderProps {
  children: ReactNode;
}

/**
 * AudioProvider component that manages background music playback and sound effects
 * Wraps the entire application to provide audio controls globally
 * 
 * @param {AudioProviderProps} props - Component props with children
 * @returns {JSX.Element} Provider component with audio management
 */
export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundManagerRef = useRef<SoundEffectsManager | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.05); // 5% volume by default for music
  const [soundVolume, setSoundVolumeState] = useState(0.5); // 50% volume for sound effects
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  /**
   * Initialize audio elements on component mount
   */
  useEffect(() => {
    // Create audio element for background music
    const audio = new Audio('/background.mp3');
    audio.loop = true; // Enable looping for continuous playback
    audio.volume = volume;
    audioRef.current = audio;

    // Create sound effects manager
    const soundManager = new SoundEffectsManager(soundVolume);
    soundManagerRef.current = soundManager;

    // Handle user interaction to enable autoplay
    const handleUserInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        
        // Attempt to play music after user interaction
        audio.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error('Failed to autoplay background music:', error);
          });
        
        // Preload all sound effects
        soundManager.preloadAll()
          .then(() => {
            console.log('[AudioProvider] Sound effects preloaded');
          })
          .catch((error) => {
            console.error('[AudioProvider] Failed to preload sound effects:', error);
          });
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    // Cleanup function
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      if (soundManagerRef.current) {
        soundManagerRef.current.cleanup();
        soundManagerRef.current = null;
      }
    };
  }, []);

  /**
   * Update audio volume when volume state changes
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  /**
   * Update sound effects volume when it changes
   */
  useEffect(() => {
    if (soundManagerRef.current) {
      soundManagerRef.current.setMasterVolume(soundVolume);
    }
  }, [soundVolume]);

  /**
   * Update sound mute state
   */
  useEffect(() => {
    if (soundManagerRef.current) {
      soundManagerRef.current.setMuted(isSoundMuted);
    }
  }, [isSoundMuted]);

  /**
   * Toggle playback between play and pause
   */
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Failed to play background music:', error);
        });
    }
  };

  /**
   * Set the volume of the background music
   * @param {number} newVolume - Volume level between 0 and 1
   */
  const setVolume = (newVolume: number) => {
    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
  };

  /**
   * Set the volume of sound effects
   * @param {number} newVolume - Volume level between 0 and 1
   */
  const setSoundVolume = (newVolume: number) => {
    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setSoundVolumeState(clampedVolume);
  };

  /**
   * Toggle sound effects mute state
   */
  const toggleSoundMute = () => {
    setIsSoundMuted(prev => !prev);
  };

  const contextValue: AudioContextType = {
    // Background music
    isPlaying,
    volume,
    togglePlayback,
    setVolume,
    
    // Sound effects
    soundManager: soundManagerRef.current,
    soundVolume,
    isSoundMuted,
    setSoundVolume,
    toggleSoundMute,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

/**
 * Custom hook to access audio controls
 * Must be used within an AudioProvider
 * 
 * @returns {AudioContextType} Audio context with playback controls
 * @throws {Error} If used outside of AudioProvider
 */
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}; 