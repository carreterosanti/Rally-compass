import { useCallback, useEffect, useRef, useState } from 'react';
import { gpsBarsFromAccuracy } from '../lib/geo';
import { DualTracker } from '../tracking/dualTracker';
import type { GpsFix, TrackingState } from '../tracking/types';

export type GPSStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'error';

export type GPSPanelView = {
  distanceM: number;
  currentSpeedKmh: number;
};

export type GPSState = {
  status: GPSStatus;
  errorMessage: string | null;
  hasFirstFix: boolean;
  accuracy: number | null;
  gpsBars: number;
  raw: GPSPanelView;
  fused: GPSPanelView;
  signalQuality: TrackingState['signalQuality'];
  isDeadReckoning: boolean;
  deadReckoningDuration: number;
  divergencePercent: number;
  divergenceAlert: boolean;
};

const TICK_INTERVAL_MS = 250;

const EMPTY_VIEW: GPSPanelView = { distanceM: 0, currentSpeedKmh: 0 };

const INITIAL_STATE: GPSState = {
  status: 'idle',
  errorMessage: null,
  hasFirstFix: false,
  accuracy: null,
  gpsBars: 0,
  raw: EMPTY_VIEW,
  fused: EMPTY_VIEW,
  signalQuality: 'lost',
  isDeadReckoning: false,
  deadReckoningDuration: 0,
  divergencePercent: 0,
  divergenceAlert: false,
};

type Options = {
  active: boolean;
};

function projectState(tracking: TrackingState, status: GPSStatus, errorMessage: string | null, hasFirstFix: boolean): GPSState {
  return {
    status,
    errorMessage,
    hasFirstFix,
    accuracy: Number.isFinite(tracking.lastAccuracy) ? tracking.lastAccuracy : null,
    gpsBars: gpsBarsFromAccuracy(
      Number.isFinite(tracking.lastAccuracy) ? tracking.lastAccuracy : null,
    ),
    raw: {
      distanceM: tracking.rawDistance,
      currentSpeedKmh: tracking.rawSpeed * 3.6,
    },
    fused: {
      distanceM: tracking.fusedDistance,
      currentSpeedKmh: tracking.fusedSpeed * 3.6,
    },
    signalQuality: tracking.signalQuality,
    isDeadReckoning: tracking.isDeadReckoning,
    deadReckoningDuration: tracking.deadReckoningDuration,
    divergencePercent: tracking.divergencePercent,
    divergenceAlert: tracking.divergenceAlert,
  };
}

export function useGPSTracking({ active }: Options) {
  const [state, setState] = useState<GPSState>(INITIAL_STATE);
  const trackerRef = useRef<DualTracker | null>(null);
  const watchId = useRef<number | null>(null);
  const hasFirstFix = useRef(false);
  const statusRef = useRef<GPSStatus>('idle');
  const errorRef = useRef<string | null>(null);
  const pausedRef = useRef(false);

  if (trackerRef.current == null) {
    trackerRef.current = new DualTracker();
  }

  const publish = useCallback(() => {
    const tracker = trackerRef.current!;
    setState(projectState(tracker.getState(), statusRef.current, errorRef.current, hasFirstFix.current));
  }, []);

  const reset = useCallback(() => {
    trackerRef.current!.reset();
    hasFirstFix.current = false;
    pausedRef.current = false;
    publish();
  }, [publish]);

  const setPaused = useCallback(
    (paused: boolean) => {
      const tracker = trackerRef.current!;
      pausedRef.current = paused;
      if (paused) tracker.pause();
      else tracker.resume();
    },
    [],
  );

  useEffect(() => {
    if (!active) {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      statusRef.current = 'unavailable';
      errorRef.current = 'Geolocation API not available';
      publish();
      return;
    }

    statusRef.current = 'requesting';
    errorRef.current = null;
    publish();

    const onSuccess = (pos: GeolocationPosition) => {
      const fix: GpsFix = {
        timestamp: pos.timestamp,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
      };
      trackerRef.current!.pushFix(fix);
      if (!hasFirstFix.current && pos.coords.accuracy <= 25) {
        hasFirstFix.current = true;
      }
      statusRef.current = 'active';
      errorRef.current = null;
      publish();
    };

    const onError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) statusRef.current = 'denied';
      else if (err.code === err.POSITION_UNAVAILABLE) statusRef.current = 'unavailable';
      else statusRef.current = 'error';
      errorRef.current = err.message;
      publish();
    };

    watchId.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    });

    const tickId = window.setInterval(() => {
      if (pausedRef.current) return;
      trackerRef.current!.tick(Date.now());
      publish();
    }, TICK_INTERVAL_MS);

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      window.clearInterval(tickId);
    };
  }, [active, publish]);

  return { ...state, reset, setPaused };
}
