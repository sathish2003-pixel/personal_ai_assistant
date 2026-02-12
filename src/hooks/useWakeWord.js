import { useEffect, useRef, useCallback } from 'react';
import useAssistantStore from '../store/useAssistantStore';

/**
 * Wake word detection hook.
 * Runs a passive SpeechRecognition listener in the background.
 * When a wake phrase is detected ("Hey Jarvis", "Hi buddy", etc.),
 * it fires onWake() which activates the main mic.
 *
 * Pauses while JARVIS is listening/processing/speaking,
 * auto-resumes when idle.
 */

const WAKE_PHRASES = [
  'hey jarvis',
  'hi jarvis',
  'hello jarvis',
  'ok jarvis',
  'okay jarvis',
  'yo jarvis',
  'jarvis',
  'hi buddy',
  'hey buddy',
  'wake up',
  'wake up jarvis',
];

export default function useWakeWord({ enabled = true, onWake }) {
  const recognitionRef = useRef(null);
  const enabledRef = useRef(enabled);
  const restartTimerRef = useRef(null);
  const isActiveRef = useRef(false);

  enabledRef.current = enabled;

  const stopWakeListener = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    isActiveRef.current = false;
  }, []);

  const startWakeListener = useCallback(() => {
    // Don't start if disabled or already running
    if (!enabledRef.current) return;
    if (isActiveRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Don't start if JARVIS is busy
    const state = useAssistantStore.getState().jarvisState;
    if (state === 'listening' || state === 'processing' || state === 'speaking') return;

    stopWakeListener();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        // Check all alternatives for wake phrases
        for (let alt = 0; alt < event.results[i].length; alt++) {
          const transcript = event.results[i][alt].transcript.toLowerCase().trim();

          for (const phrase of WAKE_PHRASES) {
            if (transcript.includes(phrase)) {
              console.log(`[WakeWord] Detected: "${transcript}" matched "${phrase}"`);
              // Stop wake listener — main mic will take over
              stopWakeListener();
              onWake?.();
              return;
            }
          }
        }
      }
    };

    recognition.onerror = (event) => {
      // 'no-speech' and 'aborted' are normal — just restart
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[WakeWord] Error:', event.error);
      }
      isActiveRef.current = false;
      // Auto-restart after a brief delay
      if (enabledRef.current) {
        restartTimerRef.current = setTimeout(startWakeListener, 1000);
      }
    };

    recognition.onend = () => {
      isActiveRef.current = false;
      // Auto-restart if still enabled and JARVIS is idle
      if (enabledRef.current) {
        const currentState = useAssistantStore.getState().jarvisState;
        if (currentState === 'idle') {
          restartTimerRef.current = setTimeout(startWakeListener, 500);
        }
      }
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      isActiveRef.current = true;
      console.log('[WakeWord] Passive listener started');
    } catch (e) {
      console.warn('[WakeWord] Failed to start:', e);
      isActiveRef.current = false;
    }
  }, [stopWakeListener, onWake]);

  // Start/stop based on enabled prop
  useEffect(() => {
    if (enabled) {
      startWakeListener();
    } else {
      stopWakeListener();
    }
    return stopWakeListener;
  }, [enabled, startWakeListener, stopWakeListener]);

  // Pause when JARVIS is busy, resume when idle
  useEffect(() => {
    const unsub = useAssistantStore.subscribe((state, prev) => {
      if (state.jarvisState !== prev.jarvisState) {
        if (state.jarvisState === 'idle' && enabledRef.current) {
          // Resume wake listener after JARVIS goes idle
          // Use longer delay to let speech synthesis fully release audio
          restartTimerRef.current = setTimeout(startWakeListener, 1500);
        } else if (
          state.jarvisState === 'listening' ||
          state.jarvisState === 'processing' ||
          state.jarvisState === 'speaking'
        ) {
          // Pause wake listener while JARVIS is active
          stopWakeListener();
        }
      }
    });
    return unsub;
  }, [startWakeListener, stopWakeListener]);

  return { stopWakeListener, startWakeListener };
}
