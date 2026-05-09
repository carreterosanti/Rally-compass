export interface GpsFix {
  /** ms since epoch */
  timestamp: number;
  latitude: number;
  longitude: number;
  /** meters (Geolocation API `coords.accuracy`) */
  accuracy: number;
  /** m/s (Geolocation API `coords.speed`); may be null */
  speed: number | null;
  /** degrees from true north; may be null */
  heading: number | null;
}

export type SignalQuality = 'good' | 'fair' | 'poor' | 'lost';

export interface TrackingState {
  rawDistance: number;
  rawSpeed: number;
  fusedDistance: number;
  fusedSpeed: number;
  lastAccuracy: number;
  signalQuality: SignalQuality;
  isDeadReckoning: boolean;
  /** ms since last accepted fix while DR is active. 0 otherwise. */
  deadReckoningDuration: number;
  divergencePercent: number;
  divergenceAlert: boolean;
  /** ms since epoch of last state update */
  lastUpdate: number;
}

export interface KalmanConfig {
  /** Q magnitude — process noise on velocity */
  processNoise: number;
  /** R base — measurement noise; scaled by (accuracy/10)^2 at runtime */
  measurementNoiseBase: number;
}

export interface TrackerConfig {
  /** Discard fixes with accuracy worse than this (m). Default 25. */
  accuracyThreshold: number;
  /** Discard fixes whose implicit speed exceeds this multiple of current
   *  fused speed (or 2 m/s floor). Default 3. */
  maxSpeedJumpFactor: number;
  /** Begin dead reckoning after this gap with no valid fix (ms). Default 2000. */
  deadReckoningStartMs: number;
  /** Stop accumulating after this DR duration (ms). Default 60000. */
  deadReckoningMaxMs: number;
  /** Trigger divergence alert when |raw - fused| / raw exceeds this %. Default 5. */
  divergenceAlertPercent: number;
  kalman: KalmanConfig;
}

export const DEFAULT_CONFIG: TrackerConfig = {
  accuracyThreshold: 25,
  maxSpeedJumpFactor: 3,
  deadReckoningStartMs: 2000,
  deadReckoningMaxMs: 60000,
  divergenceAlertPercent: 5,
  kalman: {
    processNoise: 0.1,
    measurementNoiseBase: 5,
  },
};

export const SPEED_JUMP_FLOOR_MPS = 2;
export const SIGNAL_LOST_DR_MS = 5000;
export const SIGNAL_FAIR_ACCURACY_M = 10;
export const SIGNAL_POOR_ACCURACY_M = 25;
export const DIVERGENCE_MIN_DISTANCE_M = 100;
