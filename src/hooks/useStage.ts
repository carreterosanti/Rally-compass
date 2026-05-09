import { useCallback, useEffect, useRef, useState } from 'react';
import { useGPSTracking } from './useGPSTracking';

type StageStatus = 'idle' | 'running' | 'paused';

export type PanelDerived = {
  distanceM: number;
  currentSpeedKmh: number;
  idealSec: number;
  delta: number;
  actualAvgKmh: number;
  meterDelta: number;
};

export type StageDerived = {
  elapsedSec: number;
  raw: PanelDerived;
  fused: PanelDerived;
};

export type StageController = {
  status: StageStatus;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  exit: () => void;
};

function deriveTrack(
  distanceM: number,
  currentSpeedKmh: number,
  elapsedSec: number,
  targetKmh: number,
): PanelDerived {
  const idealSec = distanceM > 0 && targetKmh > 0
    ? (distanceM / 1000) / targetKmh * 3600
    : 0;
  const delta = elapsedSec > 0 ? elapsedSec - idealSec : 0;
  const actualAvgKmh = elapsedSec > 0.5
    ? (distanceM / 1000) / (elapsedSec / 3600)
    : 0;
  const meterDelta = -(delta * targetKmh / 3.6);
  return {
    distanceM,
    currentSpeedKmh,
    idealSec,
    delta,
    actualAvgKmh,
    meterDelta,
  };
}

export function useStage(targetKmh: number) {
  const [status, setStatus] = useState<StageStatus>('idle');
  const startedAt = useRef<number | null>(null);
  const pauseStartedAt = useRef<number | null>(null);
  const pausedDurationMs = useRef(0);
  const [, force] = useState(0);
  const tick = useCallback(() => force((n) => (n + 1) % 1_000_000), []);

  const gps = useGPSTracking({ active: status === 'running' || status === 'paused' });

  useEffect(() => {
    if (status !== 'running') return;
    let raf: number;
    const loop = () => {
      tick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, tick]);

  // Sync GPS pause state with stage status
  useEffect(() => {
    gps.setPaused(status === 'paused');
  }, [gps, status]);

  const start = useCallback(() => {
    startedAt.current = Date.now();
    pauseStartedAt.current = null;
    pausedDurationMs.current = 0;
    gps.reset();
    setStatus('running');
  }, [gps]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    pauseStartedAt.current = Date.now();
    setStatus('paused');
  }, [status]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    if (pauseStartedAt.current != null) {
      pausedDurationMs.current += Date.now() - pauseStartedAt.current;
      pauseStartedAt.current = null;
    }
    setStatus('running');
  }, [status]);

  const reset = useCallback(() => {
    startedAt.current = Date.now();
    pauseStartedAt.current = null;
    pausedDurationMs.current = 0;
    gps.reset();
    setStatus('running');
  }, [gps]);

  const exit = useCallback(() => {
    startedAt.current = null;
    pauseStartedAt.current = null;
    pausedDurationMs.current = 0;
    gps.reset();
    setStatus('idle');
  }, [gps]);

  let elapsedSec = 0;
  if (startedAt.current != null) {
    const now =
      status === 'paused' && pauseStartedAt.current != null
        ? pauseStartedAt.current
        : Date.now();
    elapsedSec = Math.max(0, (now - startedAt.current - pausedDurationMs.current) / 1000);
  }

  const derived: StageDerived = {
    elapsedSec,
    raw: deriveTrack(gps.raw.distanceM, gps.raw.currentSpeedKmh, elapsedSec, targetKmh),
    fused: deriveTrack(gps.fused.distanceM, gps.fused.currentSpeedKmh, elapsedSec, targetKmh),
  };

  const controller: StageController = {
    status,
    start,
    pause,
    resume,
    reset,
    exit,
  };

  return { gps, derived, controller };
}
