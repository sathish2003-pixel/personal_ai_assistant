import { useState, useRef, useCallback, useEffect } from 'react';

export default function useAudioAnalyser() {
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const dataArrayRef = useRef(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      setIsActive(true);
    } catch (err) {
      console.error('Failed to access microphone:', err);
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    sourceRef.current = null;
    dataArrayRef.current = null;
    setIsActive(false);
  }, []);

  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return new Uint8Array(128);
    }
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    return dataArrayRef.current;
  }, []);

  const getAverageVolume = useCallback(() => {
    const data = getFrequencyData();
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length / 255; // 0 to 1
  }, [getFrequencyData]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { isActive, start, stop, getFrequencyData, getAverageVolume };
}
