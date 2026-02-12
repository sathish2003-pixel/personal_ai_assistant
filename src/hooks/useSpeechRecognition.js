import { useState, useRef, useCallback } from 'react';
import useAssistantStore from '../store/useAssistantStore';
import useSettingsStore from '../store/useSettingsStore';

export default function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const noSpeechTimerRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const hasSentRef = useRef(false);
  const onFinalResultRef = useRef(null);
  const onTimeoutRef = useRef(null);
  const gotSpeechRef = useRef(false);
  const hasTimedOutRef = useRef(false);

  const stop = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (noSpeechTimerRef.current) {
      clearTimeout(noSpeechTimerRef.current);
      noSpeechTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    useAssistantStore.getState().setInterimText('');
  }, []);

  /**
   * Start listening.
   * @param {Function} onFinalResult - called with the final transcript text
   * @param {Object} options
   * @param {number} options.noSpeechTimeoutMs - ms to wait for first speech before auto-stopping (0 = no limit)
   * @param {Function} options.onTimeout - called when recognition ends without speech (timeout, browser auto-end, etc.)
   */
  const start = useCallback((onFinalResult, options = {}) => {
    if (isListening) return;
    if (!isSupported) return;

    const { noSpeechTimeoutMs = 0, onTimeout } = options;

    // Don't start if JARVIS is speaking or processing
    const currentState = useAssistantStore.getState().jarvisState;
    if (currentState === 'speaking' || currentState === 'processing') {
      console.log('[Mic] Blocked: JARVIS state is', currentState);
      return;
    }

    // Clean up any previous instance
    stop();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const language = useSettingsStore.getState().language || 'en-US';

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = '';
    hasSentRef.current = false;
    gotSpeechRef.current = false;
    hasTimedOutRef.current = false;
    onFinalResultRef.current = onFinalResult;
    onTimeoutRef.current = onTimeout || null;
    useAssistantStore.getState().setInterimText('');

    // Helper: cleanly end recognition without speech — fires exactly once
    const fireTimeout = () => {
      if (hasTimedOutRef.current) return;
      hasTimedOutRef.current = true;
      useAssistantStore.getState().setInterimText('');
      useAssistantStore.getState().setJarvisState('idle');
      onTimeoutRef.current?.();
    };

    // No-speech timeout: auto-stop if user doesn't speak within N ms
    if (noSpeechTimeoutMs > 0) {
      noSpeechTimerRef.current = setTimeout(() => {
        if (!gotSpeechRef.current && !hasSentRef.current) {
          console.log(`[Mic] No speech detected in ${noSpeechTimeoutMs}ms, stopping`);
          try { recognition.stop(); } catch {}
          setIsListening(false);
          recognitionRef.current = null;
          fireTimeout();
        }
      }, noSpeechTimeoutMs);
    }

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Got speech — clear the no-speech timeout
      if (!gotSpeechRef.current && (final || interim)) {
        gotSpeechRef.current = true;
        if (noSpeechTimerRef.current) {
          clearTimeout(noSpeechTimerRef.current);
          noSpeechTimerRef.current = null;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
      }
      useAssistantStore.getState().setInterimText(finalTranscriptRef.current + interim);

      // Reset silence timer (2s after last speech → send)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (finalTranscriptRef.current.trim() && !hasSentRef.current) {
          hasSentRef.current = true;
          useAssistantStore.getState().setInterimText('');
          try { recognition.stop(); } catch {}
          setIsListening(false);
          recognitionRef.current = null;
          onFinalResultRef.current?.(finalTranscriptRef.current.trim());
        }
      }, 2000);
    };

    recognition.onerror = (event) => {
      console.error('[Mic] Error:', event.error);
      if (noSpeechTimerRef.current) {
        clearTimeout(noSpeechTimerRef.current);
        noSpeechTimerRef.current = null;
      }
      setIsListening(false);
      recognitionRef.current = null;

      if (event.error === 'no-speech') {
        fireTimeout();
      } else if (event.error !== 'aborted') {
        // For non-abort errors, ensure state resets to idle
        if (!hasTimedOutRef.current) {
          useAssistantStore.getState().setJarvisState('idle');
        }
      }
      // 'aborted' means we called stop() intentionally — timeout handler already ran
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (noSpeechTimerRef.current) {
        clearTimeout(noSpeechTimerRef.current);
        noSpeechTimerRef.current = null;
      }
      setIsListening(false);
      recognitionRef.current = null;

      // If there's unsent speech text, send it now
      if (finalTranscriptRef.current.trim() && !hasSentRef.current) {
        hasSentRef.current = true;
        useAssistantStore.getState().setInterimText('');
        onFinalResultRef.current?.(finalTranscriptRef.current.trim());
        return;
      }

      // No speech was sent — ensure clean state reset back to idle
      if (!hasSentRef.current) {
        fireTimeout();
      }
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      useAssistantStore.getState().setJarvisState('listening');
      console.log('[Mic] Started listening');
    } catch (e) {
      console.error('[Mic] Failed to start:', e);
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [isListening, isSupported, stop]);

  return { isListening, isSupported, start, stop };
}
