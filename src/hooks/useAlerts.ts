import { useEffect, useRef } from 'react';

type Options = {
  delta: number;
  tolerance: number;
  enabled: boolean;
  vibrate: boolean;
  active: boolean;
};

const ALERT_INTERVAL_MS = 3000;
const SEVERITY_MULTIPLIER = 2;

type AudioCtxCtor = typeof AudioContext;

function getAudioCtxCtor(): AudioCtxCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { webkitAudioContext?: AudioCtxCtor };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export function useAlerts({ delta, tolerance, enabled, vibrate, active }: Options) {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastFiredAt = useRef(0);
  const lastDirection = useRef<'late' | 'ahead' | null>(null);

  useEffect(() => {
    if (!active || !enabled) return;
    const Ctor = getAudioCtxCtor();
    if (!Ctor) return;
    const ctx = new Ctor();
    ctxRef.current = ctx;
    return () => {
      ctx.close().catch(() => {});
      ctxRef.current = null;
    };
  }, [active, enabled]);

  useEffect(() => {
    if (!active) return;
    const severity = Math.abs(delta) - tolerance * SEVERITY_MULTIPLIER;
    if (severity <= 0) {
      lastDirection.current = null;
      return;
    }
    const direction: 'late' | 'ahead' = delta > 0 ? 'late' : 'ahead';
    const now = Date.now();
    if (
      direction === lastDirection.current &&
      now - lastFiredAt.current < ALERT_INTERVAL_MS
    ) {
      return;
    }
    lastDirection.current = direction;
    lastFiredAt.current = now;

    if (enabled) {
      const ctx = ctxRef.current;
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = direction === 'late' ? 440 : 880;
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
        gain.gain.linearRampToValueAtTime(0, t + 0.32);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.34);
      }
    }

    if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(direction === 'late' ? [100, 50, 100] : [80]);
      } catch {
        // noop
      }
    }
  }, [delta, tolerance, enabled, vibrate, active]);
}
