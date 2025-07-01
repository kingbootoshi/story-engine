/**
 * Sound effect definitions and types for the audio system
 */

/**
 * Available sound effect identifiers
 */
export type SoundEffectId = 
  | 'add_event'
  | 'arc_done' 
  | 'begin_journey'
  | 'click_entities'
  | 'click_menu_button'
  | 'create_new_world'
  | 'enter_world'
  | 'gen_done'
  | 'start_seed';

/**
 * Sound effect configuration
 */
export interface SoundEffect {
  id: SoundEffectId;
  path: string;
  volume?: number; // Optional volume override (0-1)
  preload?: boolean; // Whether to preload this sound
}

/**
 * Sound library mapping
 */
export const SOUND_LIBRARY: Record<SoundEffectId, SoundEffect> = {
  add_event: {
    id: 'add_event',
    path: '/sfx/add_event.mp3',
    volume: 0.6,
    preload: true
  },
  arc_done: {
    id: 'arc_done', 
    path: '/sfx/arc_done.mp3',
    volume: 0.7,
    preload: true
  },
  begin_journey: {
    id: 'begin_journey',
    path: '/sfx/begin_journey.mp3',
    volume: 0.7,
    preload: true
  },
  click_entities: {
    id: 'click_entities',
    path: '/sfx/click_entities.mp3',
    volume: 0.5,
    preload: true
  },
  click_menu_button: {
    id: 'click_menu_button',
    path: '/sfx/click_menu_button.mp3',
    volume: 0.4,
    preload: true
  },
  create_new_world: {
    id: 'create_new_world',
    path: '/sfx/create_new_world.mp3',
    volume: 0.6,
    preload: true
  },
  enter_world: {
    id: 'enter_world',
    path: '/sfx/enter_world.mp3',
    volume: 0.6,
    preload: true
  },
  gen_done: {
    id: 'gen_done',
    path: '/sfx/gen_done.mp3',
    volume: 0.7,
    preload: true
  },
  start_seed: {
    id: 'start_seed',
    path: '/sfx/start_seed.mp3',
    volume: 0.6,
    preload: true
  }
};

/**
 * Sound playback options
 */
export interface PlaySoundOptions {
  volume?: number; // Override default volume
  onEnd?: () => void; // Callback when sound finishes
  interrupt?: boolean; // Whether to interrupt currently playing instance
}

/**
 * Sound manager interface
 */
export interface SoundManager {
  play(soundId: SoundEffectId, options?: PlaySoundOptions): void;
  preloadAll(): Promise<void>;
  setMasterVolume(volume: number): void;
  getMasterVolume(): number;
  isMuted(): boolean;
  setMuted(muted: boolean): void;
} 