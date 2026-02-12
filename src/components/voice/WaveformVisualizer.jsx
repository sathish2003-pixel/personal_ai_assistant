import { useRef, useEffect, useCallback } from 'react';

/**
 * WaveformVisualizer
 * Canvas-based audio waveform visualization.
 * Draws vertical bars from frequency data with an arc-blue-to-cyan gradient.
 * Bars pulse and glow when active; shows a flat pulsing line when inactive.
 */
export default function WaveformVisualizer({
  getFrequencyData,
  isActive = false,
  width = 200,
  height = 40,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef(0);

  // Read CSS custom properties once when the canvas is mounted
  const colorsRef = useRef({ blue: '#4FC3F7', cyan: '#00E5FF' });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const cs = getComputedStyle(document.documentElement);
    colorsRef.current = {
      blue: cs.getPropertyValue('--arc-blue').trim() || '#4FC3F7',
      cyan: cs.getPropertyValue('--hud-cyan').trim() || '#00E5FF',
    };
  }, []);

  /* ---- Draw loop ---- */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = width;
    const h = height;

    // Ensure canvas pixel size matches CSS size
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);
    phaseRef.current += 0.03;

    const { blue, cyan } = colorsRef.current;

    if (isActive && getFrequencyData) {
      // --- Active: draw frequency bars ---
      const data = getFrequencyData();
      const barCount = Math.min(data.length, 48);
      const gap = 2;
      const barWidth = (w - gap * (barCount - 1)) / barCount;

      for (let i = 0; i < barCount; i++) {
        const value = data[i] / 255;
        // Slight sine modulation for organic feel
        const pulse = 0.85 + 0.15 * Math.sin(phaseRef.current + i * 0.3);
        const barH = Math.max(1, value * h * 0.9 * pulse);
        const x = i * (barWidth + gap);
        const y = (h - barH) / 2;

        // Gradient per bar
        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, cyan);
        grad.addColorStop(1, blue);

        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.6 + value * 0.4;

        // Round-rect bars
        const radius = Math.min(barWidth / 2, 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barH - radius);
        ctx.quadraticCurveTo(x + barWidth, y + barH, x + barWidth - radius, y + barH);
        ctx.lineTo(x + radius, y + barH);
        ctx.quadraticCurveTo(x, y + barH, x, y + barH - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // Glow layer
        if (value > 0.3) {
          ctx.shadowColor = cyan;
          ctx.shadowBlur = 6 * value;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.globalAlpha = 1;
    } else {
      // --- Inactive: pulsing flat line ---
      const pulse = 0.4 + 0.2 * Math.sin(phaseRef.current * 1.5);
      const midY = h / 2;

      ctx.strokeStyle = blue;
      ctx.globalAlpha = pulse;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = cyan;
      ctx.shadowBlur = 4;

      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const wave = Math.sin(phaseRef.current * 2 + x * 0.04) * 2 * pulse;
        if (x === 0) {
          ctx.moveTo(x, midY + wave);
        } else {
          ctx.lineTo(x, midY + wave);
        }
      }
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [isActive, getFrequencyData, width, height]);

  /* ---- Start/stop animation loop ---- */
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
        background: 'transparent',
      }}
    />
  );
}
