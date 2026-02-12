import { useRef, useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import useSettingsStore from '../store/useSettingsStore';

/**
 * useSoundEffects
 *
 * Hook for playing UI sound effects via Howler.js.
 * Initializes all sounds on mount; gracefully handles missing files.
 *
 * Sound keys: 'boot', 'mic-on', 'mic-off', 'speak-start',
 *             'task-created', 'task-completed', 'reminder', 'error'
 *
 * Sounds are expected at /sounds/{key}.mp3
 *
 * Returns: { playSound, setVolume, setMuted }
 */

const SOUND_KEYS = [
  'boot',
  'mic-on',
  'mic-off',
  'speak-start',
  'task-created',
  'task-completed',
  'reminder',
  'error',
];

export default function useSoundEffects() {
  const soundsRef = useRef({});
  const mutedRef = useRef(false);

  const soundsEnabled = useSettingsStore((s) => s.soundsEnabled);
  const soundsVolume = useSettingsStore((s) => s.soundsVolume);

  // Initialize all sounds on mount
  useEffect(() => {
    const sounds = {};

    SOUND_KEYS.forEach((key) => {
      try {
        sounds[key] = new Howl({
          src: [`/sounds/${key}.mp3`],
          volume: soundsVolume,
          preload: false,
          onloaderror: (_id, err) => {
            console.warn(
              `[useSoundEffects] Could not load sound "${key}": ${err || 'file not found'}. Continuing without it.`
            );
            // Mark as unavailable so we skip it on play
            sounds[key]._loadFailed = true;
          },
        });
      } catch (err) {
        console.warn(
          `[useSoundEffects] Failed to create Howl for "${key}":`,
          err
        );
      }
    });

    soundsRef.current = sounds;

    // Cleanup on unmount
    return () => {
      Object.values(soundsRef.current).forEach((howl) => {
        try {
          howl.unload();
        } catch {
          // ignore
        }
      });
      soundsRef.current = {};
    };
    // Only initialize once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync volume when settings change
  useEffect(() => {
    Object.values(soundsRef.current).forEach((howl) => {
      try {
        howl.volume(soundsVolume);
      } catch {
        // ignore
      }
    });
  }, [soundsVolume]);

  /**
   * Play a sound by key.
   * No-op if sounds are disabled, muted, or the sound failed to load.
   */
  const playSound = useCallback(
    (soundKey) => {
      if (!soundsEnabled || mutedRef.current) return;

      const howl = soundsRef.current[soundKey];
      if (!howl) {
        console.warn(`[useSoundEffects] Unknown sound key: "${soundKey}"`);
        return;
      }
      if (howl._loadFailed) {
        // Sound file was not found; silently skip
        return;
      }

      try {
        howl.play();
      } catch (err) {
        console.warn(`[useSoundEffects] Error playing "${soundKey}":`, err);
      }
    },
    [soundsEnabled]
  );

  /**
   * Set volume for all sounds (0 to 1).
   */
  const setVolume = useCallback((vol) => {
    const clamped = Math.max(0, Math.min(1, vol));
    Object.values(soundsRef.current).forEach((howl) => {
      try {
        howl.volume(clamped);
      } catch {
        // ignore
      }
    });
  }, []);

  /**
   * Mute or unmute all sounds.
   */
  const setMuted = useCallback((muted) => {
    mutedRef.current = muted;
    Object.values(soundsRef.current).forEach((howl) => {
      try {
        howl.mute(muted);
      } catch {
        // ignore
      }
    });
  }, []);

  return { playSound, setVolume, setMuted };
}
