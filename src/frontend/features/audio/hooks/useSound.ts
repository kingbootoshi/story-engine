/**
 * React hook for playing sound effects
 */

import { useContext, useCallback } from 'react';
import { AudioContext } from '../AudioProvider';
import type { SoundEffectId, PlaySoundOptions } from '../types';

/**
 * Hook return type
 */
interface UseSoundReturn {
  play: (soundId: SoundEffectId, options?: PlaySoundOptions) => void;
  playOnClick: (soundId: SoundEffectId, options?: PlaySoundOptions) => () => void;
  isMuted: boolean;
  volume: number;
}

/**
 * Custom hook for playing sound effects
 * Must be used within an AudioProvider
 * 
 * @returns {UseSoundReturn} Object with play functions and audio state
 * 
 * @example
 * ```typescript
 * const { play, playOnClick } = useSound();
 * 
 * // Direct play
 * play('click_menu_button');
 * 
 * // As click handler
 * <button onClick={playOnClick('create_new_world')}>
 *   Create World
 * </button>
 * ```
 */
export const useSound = (): UseSoundReturn => {
  const context = useContext(AudioContext);
  
  if (!context) {
    throw new Error('useSound must be used within an AudioProvider');
  }

  const { soundManager, isSoundMuted, soundVolume } = context;

  /**
   * Play a sound effect directly
   */
  const play = useCallback((soundId: SoundEffectId, options?: PlaySoundOptions) => {
    if (!soundManager) {
      console.warn('[useSound] Sound manager not initialized');
      return;
    }
    
    soundManager.play(soundId, options);
  }, [soundManager]);

  /**
   * Returns a click handler that plays a sound
   * Useful for onClick props
   */
  const playOnClick = useCallback((soundId: SoundEffectId, options?: PlaySoundOptions) => {
    return () => play(soundId, options);
  }, [play]);

  return {
    play,
    playOnClick,
    isMuted: isSoundMuted,
    volume: soundVolume
  };
}; 