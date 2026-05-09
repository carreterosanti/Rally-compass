# `src/tracking` — Dual GPS Tracker

Pure TypeScript module that maintains **two parallel measurements** of distance traveled and current speed from a stream of GPS fixes:

- **Track A — raw.** Every fix accepted, simple Haversine integration. Baseline.
- **Track B — fused.** Outlier rejection → dead-reckoning across signal gaps → 1D constant-velocity Kalman filter on `[s, v]`.

No DOM, no `navigator`, no React. The browser/Node caller is responsible for sourcing fixes (`navigator.geolocation.watchPosition`, a replay file, a synthetic test sequence, …) and feeding them in.

## Files

| File | Role |
|---|---|
| `types.ts` | `GpsFix`, `TrackingState`, `TrackerConfig`, `DEFAULT_CONFIG` |
| `haversine.ts` | Great-circle distance between two lat/lon points |
| `kalman1d.ts` | 2-state (`s`, `v`) Kalman filter, hand-rolled, ~120 lines |
| `dualTracker.ts` | Orchestrator with the public API |
| `index.ts` | Barrel re-exports |
| `__tests__/` | Vitest suites (17 cases) |

## Usage

```ts
import { DualTracker, type GpsFix } from './tracking';

const tracker = new DualTracker({
  accuracyThreshold: 25,
  divergenceAlertPercent: 5,
});

navigator.geolocation.watchPosition(
  (pos) => {
    const fix: GpsFix = {
      timestamp: pos.timestamp,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed,
      heading: pos.coords.heading,
    };
    tracker.pushFix(fix);
  },
  console.error,
  { enableHighAccuracy: true, maximumAge: 0 },
);

// Drive dead-reckoning between fixes — call ~5–10 Hz
setInterval(() => tracker.tick(Date.now()), 200);

// Read current state at render time
const s = tracker.getState();
console.log(s.rawDistance, s.fusedDistance, s.divergencePercent);
```

## Public API

```ts
class DualTracker {
  constructor(config?: Partial<TrackerConfig>);
  pushFix(fix: GpsFix): void;
  tick(now: number): void;             // ms epoch
  getState(): TrackingState;
  reset(): void;                       // start of a new stage
  pause(): void;
  resume(): void;
}
```

`TrackingState` exposes both tracks plus quality / divergence flags:

```ts
interface TrackingState {
  rawDistance: number;
  rawSpeed: number;
  fusedDistance: number;
  fusedSpeed: number;
  lastAccuracy: number;
  signalQuality: 'good' | 'fair' | 'poor' | 'lost';
  isDeadReckoning: boolean;
  deadReckoningDuration: number;
  divergencePercent: number;
  divergenceAlert: boolean;
  lastUpdate: number;
}
```

## Pipeline (Track B)

1. **Outlier filter.** Reject if `accuracy > accuracyThreshold` or if the implicit speed between the previous accepted fix and this one exceeds `max(fusedSpeed, 2 m/s) × maxSpeedJumpFactor`. Rejected fixes still update Track A.
2. **Dead reckoning.** When more than `deadReckoningStartMs` (default 2 s) have elapsed without an accepted fix, `tick()` advances the Kalman state by extrapolating at the last estimated velocity. After `deadReckoningMaxMs` (default 60 s) the tracker stops accumulating until a new valid fix arrives.
3. **Kalman update.** `predict(dt)` → `updateBoth(z_s, z_v, R_s, R_v)` when `fix.speed` is available, otherwise `updateDistance(z_s, R_s)`. Measurement variance is scaled by `(accuracy / 10)²` so high-accuracy fixes are weighted more heavily.
4. **Quality.** `lost` while DR > 5 s; otherwise mapped from accuracy thresholds (good ≤ 10 m, fair ≤ 25 m, else poor).
5. **Divergence.** `|raw − fused| / max(raw, 1) × 100`. Alerts only after `rawDistance > 100 m` to avoid noise at the start of a stage.

## Configuration

```ts
const DEFAULT_CONFIG: TrackerConfig = {
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
```

## Determinism

The module is fully deterministic — no `Date.now()`, no `Math.random()`. `tick()` takes `now` as a parameter. Tests feed scripted fixes plus a seeded PRNG (`mulberry32` + Box-Muller) when noise is needed.

## Tests

```bash
npm test
```

17 cases across three suites:

- `haversine.test.ts` — known distances, symmetry, equator/meridian sanity
- `kalman1d.test.ts` — convergence on constant-velocity signals, distance-only updates, clamping, reset
- `dualTracker.test.ts` — outlier rejection (teleport, low accuracy), ideal driving, 30 s tunnel with DR, degraded signal, reset, pause/resume

## Performance

`pushFix` and `tick` are O(1). No history buffers, no allocations beyond a single 4-tuple `Mat2` per filter step. Safe to call at the GPS update rate (≤ 10 Hz typical) plus a `tick` every 100–500 ms.
