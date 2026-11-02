import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audioEngine';

interface VisualizerCanvasProps {
  mode: 'wave' | 'ring' | 'bars' | 'vortex';
  themeColor: string;
  isPlaying: boolean;
  className?: string;
  compact?: boolean;
}

const THEME_PALETTES: Record<string, { primary: string; secondary: string; glow: string }> = {
  cyan: { primary: '#00f0ff', secondary: '#7000ff', glow: 'rgba(0, 240, 255, 0.4)' },
  purple: { primary: '#c084fc', secondary: '#ec4899', glow: 'rgba(192, 132, 252, 0.4)' },
  emerald: { primary: '#10b981', secondary: '#06b6d4', glow: 'rgba(16, 185, 129, 0.4)' },
  crimson: { primary: '#f43f5e', secondary: '#fb923c', glow: 'rgba(244, 63, 94, 0.4)' },
  solar: { primary: '#fbbf24', secondary: '#ea580c', glow: 'rgba(251, 191, 36, 0.4)' },
  aurora: { primary: '#2dd4bf', secondary: '#818cf8', glow: 'rgba(45, 212, 191, 0.4)' }
};

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  mode,
  themeColor,
  isPlaying,
  className = '',
  compact = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || (compact ? 90 : 260));

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || (compact ? 90 : 260);
    };

    window.addEventListener('resize', handleResize);

    const freqData = new Uint8Array(128);
    const timeData = new Uint8Array(128);

    // Particle field for vortex mode
    const particleCount = compact ? 30 : 70;
    const particles = Array.from({ length: particleCount }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * (Math.min(width, height) / 2),
      speed: 0.005 + Math.random() * 0.015,
      size: 1.5 + Math.random() * 2.5,
      hueOffset: Math.random() * 40
    }));

    let phase = 0;

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      phase += 0.03;

      audioEngine.getVisualizerData(freqData, timeData);

      // If not playing, generate subtle idle breathing waves
      if (!isPlaying) {
        for (let i = 0; i < freqData.length; i++) {
          freqData[i] = Math.max(0, Math.sin(phase + i * 0.15) * 18 + 12);
        }
      }

      ctx.clearRect(0, 0, width, height);

      const palette = THEME_PALETTES[themeColor] || THEME_PALETTES.cyan;

      // Calculate bass intensity from first 6 bins
      let bassSum = 0;
      for (let i = 0; i < 6; i++) bassSum += freqData[i];
      const bassEnergy = bassSum / (6 * 255); // 0 to 1

      if (mode === 'bars') {
        renderBars(ctx, width, height, freqData, palette, compact);
      } else if (mode === 'ring') {
        renderRing(ctx, width, height, freqData, palette, bassEnergy, phase, compact);
      } else if (mode === 'vortex') {
        renderVortex(ctx, width, height, freqData, particles, palette, bassEnergy, phase);
      } else {
        renderWave(ctx, width, height, freqData, timeData, palette, bassEnergy, phase, compact);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [mode, themeColor, isPlaying, compact]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block pointer-events-none ${className}`}
      aria-label="Audio Visualizer Display"
    />
  );
};

function renderWave(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  freq: Uint8Array,
  time: Uint8Array,
  palette: { primary: string; secondary: string; glow: string },
  bass: number,
  phase: number,
  compact: boolean
) {
  const centerY = h / 2;
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, palette.secondary);
  gradient.addColorStop(0.5, palette.primary);
  gradient.addColorStop(1, palette.secondary);

  // Background subtle liquid flow
  ctx.save();
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = compact ? 8 : 16;
  ctx.lineWidth = compact ? 2 : 3.5;
  ctx.strokeStyle = gradient;

  // Wave 1: Main Audio Waveform
  ctx.beginPath();
  const sliceWidth = w / 64;
  for (let i = 0; i < 64; i++) {
    const v = (time[i] - 128) / 128; // -1 to 1
    const f = freq[i] / 255;
    const amp = (compact ? 24 : 60) * (f * 0.8 + 0.2 + bass * 0.5);
    const y = centerY + v * amp + Math.sin(phase * 1.5 + i * 0.2) * (compact ? 4 : 10);
    const x = i * sliceWidth;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Wave 2: Harmonic Secondary Wave (Translucent)
  if (!compact) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = palette.secondary;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let i = 0; i < 64; i++) {
      const f = freq[63 - i] / 255;
      const y = centerY - f * 45 * Math.sin(phase * 2 + i * 0.25);
      const x = i * sliceWidth;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function renderRing(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  freq: Uint8Array,
  palette: { primary: string; secondary: string; glow: string },
  bass: number,
  phase: number,
  compact: boolean
) {
  const cx = w / 2;
  const cy = h / 2;
  const baseRadius = (Math.min(w, h) / 2) * (compact ? 0.55 : 0.48);
  const barCount = compact ? 40 : 64;

  ctx.save();
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = compact ? 10 : 20;

  // Inner pulsing holographic core
  const coreRadius = baseRadius * 0.7 * (1 + bass * 0.25);
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
  coreGrad.addColorStop(0, palette.primary);
  coreGrad.addColorStop(0.7, palette.secondary);
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
  ctx.fill();

  // Circular spectrum bars
  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2 + phase * 0.2;
    const freqIdx = Math.floor((i / barCount) * (freq.length / 2));
    const val = freq[freqIdx] / 255;
    const barHeight = val * (compact ? 25 : 55) + 3;

    const x1 = cx + Math.cos(angle) * baseRadius;
    const y1 = cy + Math.sin(angle) * baseRadius;
    const x2 = cx + Math.cos(angle) * (baseRadius + barHeight);
    const y2 = cy + Math.sin(angle) * (baseRadius + barHeight);

    ctx.strokeStyle = i % 2 === 0 ? palette.primary : palette.secondary;
    ctx.lineWidth = compact ? 2 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

function renderBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  freq: Uint8Array,
  palette: { primary: string; secondary: string; glow: string },
  compact: boolean
) {
  const count = compact ? 24 : 48;
  const barWidth = (w / count) * 0.75;
  const gap = (w / count) * 0.25;

  ctx.save();
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = compact ? 6 : 14;

  for (let i = 0; i < count; i++) {
    const freqIdx = Math.floor((i / count) * 60);
    const val = freq[freqIdx] / 255;
    const barHeight = Math.max(3, val * (h * 0.85));

    const x = i * (barWidth + gap) + gap / 2;
    const y = h - barHeight;

    const grad = ctx.createLinearGradient(0, h, 0, y);
    grad.addColorStop(0, palette.secondary);
    grad.addColorStop(1, palette.primary);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
    ctx.fill();

    // Floating peak cap
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, Math.max(0, y - 3), barWidth, 1.5);
  }
  ctx.restore();
}

function renderVortex(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  freq: Uint8Array,
  particles: Array<{ angle: number; radius: number; speed: number; size: number; hueOffset: number }>,
  palette: { primary: string; secondary: string; glow: string },
  bass: number,
  phase: number
) {
  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy);

  ctx.save();
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = 12;

  particles.forEach((p, idx) => {
    p.angle += p.speed * (1 + bass * 2);
    p.radius += 0.8 * (1 + bass * 1.5);
    if (p.radius > maxRadius) {
      p.radius = 10;
      p.angle = Math.random() * Math.PI * 2;
    }

    const x = cx + Math.cos(p.angle) * p.radius;
    const y = cy + Math.sin(p.angle) * p.radius;

    const freqIdx = idx % freq.length;
    const energy = freq[freqIdx] / 255;

    ctx.fillStyle = idx % 2 === 0 ? palette.primary : palette.secondary;
    ctx.beginPath();
    ctx.arc(x, y, p.size * (1 + energy * 1.5 + bass), 0, Math.PI * 2);
    ctx.fill();
  });

  // Center vortex eye
  const eyeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50 * (1 + bass * 0.5));
  eyeGrad.addColorStop(0, palette.primary);
  eyeGrad.addColorStop(0.6, palette.secondary);
  eyeGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = eyeGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 50 * (1 + bass * 0.5), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
