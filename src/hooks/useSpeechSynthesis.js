import { useState, useRef, useCallback, useEffect } from 'react';
import useAssistantStore from '../store/useAssistantStore';
import useSettingsStore from '../store/useSettingsStore';

export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const isSpeakingRef = useRef(false);
  const queueRef = useRef([]);
  const resumeIntervalRef = useRef(null);
  const safetyTimerRef = useRef(null);

  const { voiceSpeed, voicePitch, voiceName } = useSettingsStore();

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis?.getVoices() || [];
      setVoices(available);
    };

    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis?.cancel();
      if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  const getSelectedVoice = useCallback(() => {
    if (voiceName === 'default' || !voices.length) return null;
    return voices.find((v) => v.name === voiceName) || null;
  }, [voices, voiceName]);

  const _stopResumeTimer = () => {
    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }
  };

  const _startResumeTimer = () => {
    // Chrome bug workaround: Chrome pauses SpeechSynthesis after ~15s.
    // Periodically call resume() to keep it alive.
    _stopResumeTimer();
    resumeIntervalRef.current = setInterval(() => {
      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.resume();
      }
    }, 5000);
  };

  const _clearSafetyTimer = () => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  const _cleanup = useCallback(() => {
    _stopResumeTimer();
    _clearSafetyTimer();
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;

    // If already speaking, queue instead
    if (isSpeakingRef.current) {
      queueRef.current.push(text);
      return;
    }

    // Clear any stale/stuck state before speaking
    window.speechSynthesis.cancel();
    _clearSafetyTimer();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeed;
    utterance.pitch = voicePitch;

    const voice = getSelectedVoice();
    if (voice) utterance.voice = voice;

    let started = false;

    utterance.onstart = () => {
      started = true;
      console.log('[TTS] Speaking started');
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      useAssistantStore.getState().setJarvisState('speaking');
      _startResumeTimer();

      // Safety: force cleanup if onend never fires (Chrome stuck bug)
      // Estimate duration: ~80ms per char at 1x speed, min 3s, max 30s
      const estimatedMs = Math.min(Math.max((text.length * 80) / voiceSpeed, 3000), 30000);
      _clearSafetyTimer();
      safetyTimerRef.current = setTimeout(() => {
        if (isSpeakingRef.current) {
          console.warn('[TTS] Safety: forcing end after timeout');
          window.speechSynthesis.cancel();
          _cleanup();
          if (queueRef.current.length > 0) {
            const next = queueRef.current.shift();
            setTimeout(() => speak(next), 150);
          } else {
            useAssistantStore.getState().setJarvisState('idle');
          }
        }
      }, estimatedMs + 2000);
    };

    utterance.onend = () => {
      console.log('[TTS] Speaking ended');
      _cleanup();

      // Process queue
      if (queueRef.current.length > 0) {
        const next = queueRef.current.shift();
        setTimeout(() => speak(next), 100);
      } else {
        useAssistantStore.getState().setJarvisState('idle');
      }
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled') {
        console.error('[TTS] Error:', event.error);
      }
      _cleanup();
      queueRef.current = [];
      useAssistantStore.getState().setJarvisState('idle');
    };

    // Speak with delay — gives Chrome time to release audio after SpeechRecognition
    setTimeout(() => {
      // Ensure synth is ready
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();
      console.log('[TTS] Utterance queued');

      // If onstart doesn't fire within 800ms, TTS silently failed — retry once
      setTimeout(() => {
        if (!started && !isSpeakingRef.current) {
          console.warn('[TTS] onstart did not fire, retrying...');
          window.speechSynthesis.cancel();

          setTimeout(() => {
            const retry = new SpeechSynthesisUtterance(text);
            retry.rate = voiceSpeed;
            retry.pitch = voicePitch;
            const v = getSelectedVoice();
            if (v) retry.voice = v;

            retry.onstart = utterance.onstart;
            retry.onend = utterance.onend;
            retry.onerror = utterance.onerror;

            window.speechSynthesis.resume();
            window.speechSynthesis.speak(retry);
            window.speechSynthesis.resume();
            console.log('[TTS] Retry utterance queued');

            // If retry also fails, give up and reset state
            setTimeout(() => {
              if (!started && !isSpeakingRef.current) {
                console.warn('[TTS] Retry also failed, resetting state');
                window.speechSynthesis.cancel();
                useAssistantStore.getState().setJarvisState('idle');
              }
            }, 800);
          }, 200);
        }
      }, 800);
    }, 150);
  }, [voiceSpeed, voicePitch, getSelectedVoice, _cleanup]);

  const cancel = useCallback(() => {
    _cleanup();
    window.speechSynthesis?.cancel();
    queueRef.current = [];
    useAssistantStore.getState().setJarvisState('idle');
  }, [_cleanup]);

  return { speak, cancel, isSpeaking, voices };
}
