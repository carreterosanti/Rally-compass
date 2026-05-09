import { haversineMeters } from './haversine';
import { Kalman1D } from './kalman1d';
import {
  DEFAULT_CONFIG,
  DIVERGENCE_MIN_DISTANCE_M,
  SIGNAL_FAIR_ACCURACY_M,
  SIGNAL_LOST_DR_MS,
  SIGNAL_POOR_ACCURACY_M,
  SPEED_JUMP_FLOOR_MPS,
  type GpsFix,
  type SignalQuality,
  type TrackerConfig,
  type TrackingState,
} from './types';

/**
 * Maintains two parallel measurements of distance and speed:
 *
 *   • Track A — raw GPS, every fix accepted, simple Haversine integration.
 *   • Track B — outlier-filtered, dead-reckoned, Kalman-fused.
 *
 * Inputs are pushed in via `pushFix`. Between fixes, call `tick(now)` to
 * advance dead-reckoning. The tracker is pure: no DOM / browser API access.
 */
export class DualTracker {
  private readonly cfg: TrackerConfig;

  private rawLastFix: GpsFix | null = null;
  private rawDistance = 0;
  private rawSpeed = 0;

  private fusedLastAcceptedFix: GpsFix | null = null;
  /** Sum of all Δs (Haversine) accepted into the fused track. Used as the
   *  absolute distance observation for the Kalman filter. */
  private fusedObservedAccumS = 0;
  private kalman = new Kalman1D();
  /** Last time the Kalman filter was advanced (ms epoch). */
  private kalmanLastT: number | null = null;
  /** Timestamp of last accepted fix — origin for DR. */
  private lastValidT: number | null = null;

  private lastAccuracy = Number.POSITIVE_INFINITY;
  private isDeadReckoning = false;
  private deadReckoningDuration = 0;
  /** When DR has been active beyond `deadReckoningMaxMs` we stop accumulating
   *  distance until a new valid fix arrives. */
  private drCapped = false;

  private paused = false;
  private lastUpdate = 0;

  constructor(config: Partial<TrackerConfig> = {}) {
    this.cfg = {
      ...DEFAULT_CONFIG,
      ...config,
      kalman: { ...DEFAULT_CONFIG.kalman, ...(config.kalman ?? {}) },
    };
  }

  pushFix(fix: GpsFix): void {
    if (this.paused) return;

    // ── Track A — raw, always accumulates ─────────────────────────────
    if (this.rawLastFix) {
      const dRaw = haversineMeters(
        this.rawLastFix.latitude,
        this.rawLastFix.longitude,
        fix.latitude,
        fix.longitude,
      );
      const dtRaw = (fix.timestamp - this.rawLastFix.timestamp) / 1000;
      this.rawDistance += dRaw;
      if (fix.speed != null && Number.isFinite(fix.speed) && fix.speed >= 0) {
        this.rawSpeed = fix.speed;
      } else if (dtRaw > 0) {
        this.rawSpeed = dRaw / dtRaw;
      }
    } else if (fix.speed != null && fix.speed >= 0) {
      this.rawSpeed = fix.speed;
    }
    this.rawLastFix = fix;

    // ── Track B — filtered + Kalman ──────────────────────────────────
    this.lastAccuracy = fix.accuracy;
    let accept = true;
    let dFused = 0;
    let dt = 0;

    if (fix.accuracy > this.cfg.accuracyThreshold) {
      accept = false;
    } else if (this.fusedLastAcceptedFix) {
      dFused = haversineMeters(
        this.fusedLastAcceptedFix.latitude,
        this.fusedLastAcceptedFix.longitude,
        fix.latitude,
        fix.longitude,
      );
      dt = (fix.timestamp - this.fusedLastAcceptedFix.timestamp) / 1000;
      if (dt > 0) {
        const implicit = dFused / dt;
        const speedRef = Math.max(this.kalman.v, SPEED_JUMP_FLOOR_MPS);
        if (implicit > speedRef * this.cfg.maxSpeedJumpFactor) {
          accept = false;
        }
      }
    }

    if (accept) {
      // Reconcile any pending dead-reckoning with the real fix:
      // first advance the Kalman state in time so its s/v are at `fix.timestamp`,
      // then feed the absolute distance + (optional) velocity observation.
      if (this.fusedLastAcceptedFix && this.kalmanLastT != null) {
        const predictDt = (fix.timestamp - this.kalmanLastT) / 1000;
        if (predictDt > 0) {
          this.kalman.predict(predictDt, this.cfg.kalman.processNoise);
        }
      } else {
        // First accepted fix — initialize Kalman.
        const v0 = fix.speed != null && fix.speed >= 0 ? fix.speed : 0;
        this.kalman.reset(0, v0, 1e3, 1e3);
      }

      this.fusedObservedAccumS += dFused;
      const accFactor = Math.max(fix.accuracy, 1) / 10;
      const R_s = this.cfg.kalman.measurementNoiseBase * accFactor * accFactor;

      if (fix.speed != null && Number.isFinite(fix.speed) && fix.speed >= 0) {
        const R_v = this.cfg.kalman.measurementNoiseBase * accFactor;
        this.kalman.updateBoth(this.fusedObservedAccumS, fix.speed, R_s, R_v);
      } else {
        this.kalman.updateDistance(this.fusedObservedAccumS, R_s);
      }

      this.fusedLastAcceptedFix = fix;
      this.kalmanLastT = fix.timestamp;
      this.lastValidT = fix.timestamp;
      this.isDeadReckoning = false;
      this.deadReckoningDuration = 0;
      this.drCapped = false;
    }

    this.lastUpdate = fix.timestamp;
  }

  tick(now: number): void {
    if (this.paused) return;
    if (this.lastValidT == null) {
      this.lastUpdate = now;
      return;
    }
    const gap = now - this.lastValidT;
    if (gap > this.cfg.deadReckoningStartMs) {
      if (gap > this.cfg.deadReckoningMaxMs) {
        this.drCapped = true;
        this.isDeadReckoning = true;
        this.deadReckoningDuration = gap;
        this.lastUpdate = now;
        return;
      }
      this.isDeadReckoning = true;
      this.deadReckoningDuration = gap;
      // Advance Kalman by the elapsed time so its `s` reflects the
      // dead-reckoned distance. We do NOT push a measurement.
      if (this.kalmanLastT != null) {
        const dt = (now - this.kalmanLastT) / 1000;
        if (dt > 0) {
          this.kalman.predict(dt, this.cfg.kalman.processNoise);
          this.kalmanLastT = now;
        }
      }
    }
    this.lastUpdate = now;
  }

  getState(): TrackingState {
    const fusedDistance = this.kalman.s;
    const fusedSpeed = Math.max(0, this.kalman.v);
    const denom = Math.max(this.rawDistance, 1);
    const divergencePercent = (Math.abs(this.rawDistance - fusedDistance) / denom) * 100;
    const divergenceAlert =
      this.rawDistance > DIVERGENCE_MIN_DISTANCE_M &&
      divergencePercent > this.cfg.divergenceAlertPercent;

    return {
      rawDistance: this.rawDistance,
      rawSpeed: this.rawSpeed,
      fusedDistance,
      fusedSpeed,
      lastAccuracy: this.lastAccuracy,
      signalQuality: this.computeQuality(),
      isDeadReckoning: this.isDeadReckoning,
      deadReckoningDuration: this.deadReckoningDuration,
      divergencePercent,
      divergenceAlert,
      lastUpdate: this.lastUpdate,
    };
  }

  reset(): void {
    this.rawLastFix = null;
    this.rawDistance = 0;
    this.rawSpeed = 0;
    this.fusedLastAcceptedFix = null;
    this.fusedObservedAccumS = 0;
    this.kalman.reset();
    this.kalmanLastT = null;
    this.lastValidT = null;
    this.lastAccuracy = Number.POSITIVE_INFINITY;
    this.isDeadReckoning = false;
    this.deadReckoningDuration = 0;
    this.drCapped = false;
    this.paused = false;
    this.lastUpdate = 0;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  isDeadReckoningCapped(): boolean {
    return this.drCapped;
  }

  private computeQuality(): SignalQuality {
    if (this.isDeadReckoning && this.deadReckoningDuration > SIGNAL_LOST_DR_MS) {
      return 'lost';
    }
    if (this.lastAccuracy > SIGNAL_POOR_ACCURACY_M) return 'poor';
    if (this.lastAccuracy > SIGNAL_FAIR_ACCURACY_M) return 'fair';
    return 'good';
  }
}
