import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '@/theme/tokens';

const BAR_COUNT = 56;
const INNER_RADIUS = 78;
const MAX_BAR_LENGTH = 72;
const MIN_BAR_LENGTH = 6;

interface AudioFrequencyVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
  size?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AudioFrequencyVisualizer({
  stream,
  isActive,
  size = 300,
}: AudioFrequencyVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const idlePhaseRef = useRef(0);

  useEffect(() => {
    displayRef.current = new Float32Array(BAR_COUNT);
    analyserRef.current = null;

    if (!stream) {
      return;
    }

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyserRef.current = analyser;

    return () => {
      source.disconnect();
      analyser.disconnect();
      void audioContext.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    };
  }, [stream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const freqData = new Uint8Array(analyserRef.current?.frequencyBinCount ?? 128);
    const reducedMotion = prefersReducedMotion();
    const smoothing = reducedMotion ? 0.12 : 0.26;

    const draw = () => {
      const analyser = analyserRef.current;
      const display = displayRef.current;

      if (analyser && isActive) {
        analyser.getByteFrequencyData(freqData);
        const binCount = freqData.length;
        for (let i = 0; i < BAR_COUNT; i += 1) {
          const t = i / (BAR_COUNT - 1);
          const binIndex = Math.min(
            binCount - 1,
            Math.floor(Math.pow(t, 1.65) * (binCount - 1)),
          );
          const target = freqData[binIndex] / 255;
          display[i] += (target - display[i]) * smoothing;
        }
      } else {
        idlePhaseRef.current += reducedMotion ? 0.015 : 0.04;
        for (let i = 0; i < BAR_COUNT; i += 1) {
          const wave =
            0.08 +
            Math.sin(idlePhaseRef.current + i * 0.35) * 0.05 +
            Math.sin(idlePhaseRef.current * 0.6 + i * 0.12) * 0.03;
          display[i] += (wave - display[i]) * 0.08;
        }
      }

      ctx.clearRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(cx, cy, INNER_RADIUS - 14, 0, Math.PI * 2);
      ctx.strokeStyle = palette.green100;
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let i = 0; i < BAR_COUNT; i += 1) {
        const magnitude = display[i];
        const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
        const barLen = MIN_BAR_LENGTH + magnitude * MAX_BAR_LENGTH;
        const x1 = cx + Math.cos(angle) * INNER_RADIUS;
        const y1 = cy + Math.sin(angle) * INNER_RADIUS;
        const x2 = cx + Math.cos(angle) * (INNER_RADIUS + barLen);
        const y2 = cy + Math.sin(angle) * (INNER_RADIUS + barLen);

        const mix = Math.min(1, magnitude * 1.35);
        const r = Math.round(24 + (34 - 24) * mix);
        const g = Math.round(163 + (214 - 163) * mix);
        const b = Math.round(93 + (147 - 93) * mix);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.35 + magnitude * 0.65})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      const avg =
        display.reduce((sum, value) => sum + value, 0) / Math.max(display.length, 1);
      if (avg > 0.04 && isActive) {
        ctx.beginPath();
        ctx.arc(cx, cy, INNER_RADIUS + MAX_BAR_LENGTH * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(95, 214, 147, ${0.08 + avg * 0.12})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isActive, size, stream]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <canvas ref={canvasRef} aria-hidden />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
