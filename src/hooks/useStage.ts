import { useCallback, useEffect, useRef, useState } from 'react';
import { useGPSTracking } from './useGPSTracking';

type StageStatus = 'idle' | 'armed' | 'running';

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
  /** Wait for the real start: GPS warms up, the clock stays at zero. */
  arm: () => void;
  /** Start (or restart) the stage clock. Returns the START epoch ms. */
  start: () => number;
  exit: () => void;
  /** Stage clock right now, in seconds. */
  elapsedNow: () => number;
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
  // Ref for event handlers (exact time of a tap), state for rendering.
  const startedAtRef = useRef<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  const gps = useGPSTracking({ active: status !== 'idle' });

  useEffect(() => {
    if (status !== 'running') return;
    let raf: number;
    const loop = () => {
      setNow(Date.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  const arm = useCallback(() => {
    startedAtRef.current = null;
    setStartedAt(null);
    gps.reset();
    setStatus('armed');
  }, [gps]);

  const start = useCallback(() => {
    const t = Date.now();
    startedAtRef.current = t;
    setStartedAt(t);
    setNow(t);
    gps.reset();
    setStatus('running');
    return t;
  }, [gps]);

  const exit = useCallback(() => {
    startedAtRef.current = null;
    setStartedAt(null);
    gps.reset();
    setStatus('idle');
  }, [gps]);

  const elapsedNow = useCallback(
    () =>
      startedAtRef.current == null ? 0 : Math.max(0, (Date.now() - startedAtRef.current) / 1000),
    [],
  );

  const elapsedSec = startedAt == null ? 0 : Math.max(0, (now - startedAt) / 1000);

  const derived: StageDerived = {
    elapsedSec,
    raw: deriveTrack(gps.raw.distanceM, gps.raw.currentSpeedKmh, elapsedSec, targetKmh),
    fused: deriveTrack(gps.fused.distanceM, gps.fused.currentSpeedKmh, elapsedSec, targetKmh),
  };

  const controller: StageController = {
    status,
    arm,
    start,
    exit,
    elapsedNow,
  };

  return { gps, derived, controller };
}
