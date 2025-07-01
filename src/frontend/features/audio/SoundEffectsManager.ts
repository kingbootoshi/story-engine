/**
 * Sound effects manager for handling playback and caching of sound effects
 */

import { SOUND_LIBRARY, type SoundEffectId, type SoundManager, type PlaySoundOptions } from './types';

/**
 * Manages sound effect playback with caching and volume control
 */
export class SoundEffectsManager implements SoundManager {
  private audioCache: Map<SoundEffectId, HTMLAudioElement[]> = new Map();
  private masterVolume: number = 1;
  private muted: boolean = false;
  private loadingPromises: Map<SoundEffectId, Promise<void>> = new Map();

  /**
   * Creates a new SoundEffectsManager instance
   * @param {number} initialVolume - Initial master volume (0-1)
   */
  constructor(initialVolume: number = 1) {
    this.masterVolume = initialVolume;
    console.log('[SoundEffectsManager] Initialized with volume:', initialVolume);
  }

  /**
   * Preloads all sound effects marked for preloading
   * @returns {Promise<void>} Promise that resolves when all sounds are loaded
   */
  async preloadAll(): Promise<void> {
    console.log('[SoundEffectsManager] Starting preload of all sound effects');
    
    const preloadPromises = Object.entries(SOUND_LIBRARY)
      .filter(([_, sound]) => sound.preload)
      .map(([id]) => this.preloadSound(id as SoundEffectId));

    try {
      await Promise.all(preloadPromises);
      console.log('[SoundEffectsManager] All sounds preloaded successfully');
    } catch (error) {
      console.error('[SoundEffectsManager] Error preloading sounds:', error);
    }
  }

  /**
   * Preloads a specific sound effect
   * @param {SoundEffectId} soundId - ID of the sound to preload
   * @returns {Promise<void>} Promise that resolves when sound is loaded
   */
  private async preloadSound(soundId: SoundEffectId): Promise<void> {
    // Check if already loading
    const existingPromise = this.loadingPromises.get(soundId);
    if (existingPromise) {
      return existingPromise;
    }

    // Check if already cached
    if (this.audioCache.has(soundId)) {
      return Promise.resolve();
    }

    const soundConfig = SOUND_LIBRARY[soundId];
    if (!soundConfig) {
      console.error(`[SoundEffectsManager] Sound not found: ${soundId}`);
      return Promise.reject(new Error(`Sound not found: ${soundId}`));
    }

    // Create loading promise
    const loadPromise = new Promise<void>((resolve, reject) => {
      const audio = new Audio(soundConfig.path);
      audio.volume = this.calculateVolume(soundConfig.volume);
      
      audio.addEventListener('canplaythrough', () => {
        // Cache the audio element
        this.audioCache.set(soundId, [audio]);
        this.loadingPromises.delete(soundId);
        console.log(`[SoundEffectsManager] Preloaded: ${soundId}`);
        resolve();
      }, { once: true });

      audio.addEventListener('error', (error) => {
        this.loadingPromises.delete(soundId);
        console.error(`[SoundEffectsManager] Failed to preload ${soundId}:`, error);
        reject(error);
      }, { once: true });

      // Start loading
      audio.load();
    });

    this.loadingPromises.set(soundId, loadPromise);
    return loadPromise;
  }

  /**
   * Plays a sound effect
   * @param {SoundEffectId} soundId - ID of the sound to play
   * @param {PlaySoundOptions} options - Playback options
   */
  play(soundId: SoundEffectId, options: PlaySoundOptions = {}): void {
    if (this.muted) {
      console.log(`[SoundEffectsManager] Sound muted, skipping: ${soundId}`);
      return;
    }

    const soundConfig = SOUND_LIBRARY[soundId];
    if (!soundConfig) {
      console.error(`[SoundEffectsManager] Sound not found: ${soundId}`);
      return;
    }

    console.log(`[SoundEffectsManager] Playing sound: ${soundId}`);

    // Get or create audio element
    this.getOrCreateAudio(soundId)
      .then(audio => {
        // Configure volume
        const volume = this.calculateVolume(options.volume ?? soundConfig.volume);
        audio.volume = volume;

        // Handle interruption
        if (options.interrupt && !audio.paused) {
          audio.currentTime = 0;
        }

        // Set up end callback
        if (options.onEnd) {
          audio.addEventListener('ended', options.onEnd, { once: true });
        }

        // Play the sound
        audio.play()
          .catch(error => {
            console.error(`[SoundEffectsManager] Failed to play ${soundId}:`, error);
          });
      })
      .catch(error => {
        console.error(`[SoundEffectsManager] Failed to get audio for ${soundId}:`, error);
      });
  }

  /**
   * Gets or creates an audio element for a sound
   * @param {SoundEffectId} soundId - ID of the sound
   * @returns {Promise<HTMLAudioElement>} Audio element ready to play
   */
  private async getOrCreateAudio(soundId: SoundEffectId): Promise<HTMLAudioElement> {
    // Check cache first
    const cached = this.audioCache.get(soundId);
    if (cached && cached.length > 0) {
      // Find an available audio element (not currently playing)
      const available = cached.find(audio => audio.paused || audio.ended);
      if (available) {
        available.currentTime = 0;
        return available;
      }

      // All cached instances are playing, create a new one for polyphony
      const soundConfig = SOUND_LIBRARY[soundId];
      const audio = new Audio(soundConfig.path);
      audio.volume = this.calculateVolume(soundConfig.volume);
      cached.push(audio);
      return audio;
    }

    // Not cached, preload it
    await this.preloadSound(soundId);
    const newCached = this.audioCache.get(soundId);
    if (!newCached || newCached.length === 0) {
      throw new Error(`Failed to load sound: ${soundId}`);
    }
    return newCached[0];
  }

  /**
   * Calculates the final volume based on master volume and sound-specific volume
   * @param {number} soundVolume - Sound-specific volume (0-1)
   * @returns {number} Final volume to apply
   */
  private calculateVolume(soundVolume: number = 1): number {
    return Math.max(0, Math.min(1, this.masterVolume * soundVolume));
  }

  /**
   * Sets the master volume for all sound effects
   * @param {number} volume - Master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log(`[SoundEffectsManager] Master volume set to: ${this.masterVolume}`);
    
    // Update volume for all cached audio elements
    this.audioCache.forEach((audioElements, soundId) => {
      const soundConfig = SOUND_LIBRARY[soundId];
      const newVolume = this.calculateVolume(soundConfig.volume);
      audioElements.forEach(audio => {
        audio.volume = newVolume;
      });
    });
  }

  /**
   * Gets the current master volume
   * @returns {number} Current master volume (0-1)
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Checks if sounds are muted
   * @returns {boolean} True if muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Sets the muted state
   * @param {boolean} muted - Whether to mute sounds
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    console.log(`[SoundEffectsManager] Muted state: ${muted}`);
    
    if (muted) {
      // Stop all currently playing sounds
      this.audioCache.forEach(audioElements => {
        audioElements.forEach(audio => {
          if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
          }
        });
      });
    }
  }

  /**
   * Cleans up all cached audio elements
   */
  cleanup(): void {
    console.log('[SoundEffectsManager] Cleaning up audio cache');
    
    this.audioCache.forEach(audioElements => {
      audioElements.forEach(audio => {
        if (!audio.paused) {
          audio.pause();
        }
        audio.src = '';
      });
    });
    
    this.audioCache.clear();
    this.loadingPromises.clear();
  }
} 