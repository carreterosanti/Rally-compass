import { describe, expect, it } from 'vitest';
import { DualTracker } from '../dualTracker';
import { haversineMeters } from '../haversine';
import type { GpsFix } from '../types';
import { gaussian, mulberry32 } from './seededRandom';

const ORIGIN = { lat: 40.0, lon: -3.7 };
// Spherical-Earth meridian: 2πR / 360 with R = 6371 km — matches Haversine.
const M_PER_DEG_LAT = (Math.PI * 6371000) / 180;

/** Build a fix N meters north of the origin (decimal-degree approximation). */
function fixNorthMeters(
  metersNorth: number,
  timestampMs: number,
  opts: { accuracy?: number; speed?: number | null } = {},
): GpsFix {
  const { accuracy = 5, speed = null } = opts;
  return {
    timestamp: timestampMs,
    latitude: ORIGIN.lat + metersNorth / M_PER_DEG_LAT,
    longitude: ORIGIN.lon,
    accuracy,
    speed,
    heading: null,
  };
}

describe('DualTracker — outlier filter', () => {
  it('teleport is absorbed by raw track but rejected by fused track', () => {
    const tracker = new DualTracker();
    let t = 1_700_000_000_000;
    for (let i = 0; i < 5; i++) {
      tracker.pushFix(fixNorthMeters(20 * i, t, { speed: 20 }));
      t += 1000;
    }
    const before = tracker.getState();
    expect(before.rawDistance).toBeGreaterThan(70);
    expect(before.fusedDistance).toBeGreaterThan(70);

    // Teleport: 500m jump in 1s (impossible at 20m/s)
    tracker.pushFix(fixNorthMeters(20 * 4 + 500, t, { speed: 20 }));
    t += 1000;
    const after = tracker.getState();

    // Raw absorbed the teleport; fused did not move much
    expect(after.rawDistance - before.rawDistance).toBeGreaterThan(450);
    expect(after.fusedDistance - before.fusedDistance).toBeLessThan(50);
  });

  it('low-accuracy fixes are rejected by fused track', () => {
    const tracker = new DualTracker({ accuracyThreshold: 25 });
    const t0 = 1_700_000_000_000;
    tracker.pushFix(fixNorthMeters(0, t0, { accuracy: 5, speed: 20 }));
    tracker.pushFix(fixNorthMeters(20, t0 + 1000, { accuracy: 5, speed: 20 }));
    // bad fix
    tracker.pushFix(fixNorthMeters(40, t0 + 2000, { accuracy: 80, speed: 20 }));

    const s = tracker.getState();
    expect(s.signalQuality).toBe('poor');
    expect(s.rawDistance).toBeGreaterThan(35);
    // fused only got the first two (~20m)
    expect(s.fusedDistance).toBeLessThan(35);
  });
});

describe('DualTracker — integration', () => {
  it('ideal driving: raw ≈ fused ≈ 1200m, divergence < 1%', () => {
    const tracker = new DualTracker();
    const t0 = 1_700_000_000_000;
    const speed = 20; // m/s
    for (let i = 0; i < 60; i++) {
      tracker.pushFix(
        fixNorthMeters(i * speed, t0 + i * 1000, { accuracy: 5, speed }),
      );
    }
    const s = tracker.getState();
    expect(s.rawDistance).toBeGreaterThan(1150);
    expect(s.rawDistance).toBeLessThan(1200);
    expect(s.fusedDistance).toBeGreaterThan(1150);
    expect(s.fusedDistance).toBeLessThan(1200);
    expect(s.divergencePercent).toBeLessThan(1);
    expect(s.divergenceAlert).toBe(false);
    expect(s.signalQuality).toBe('good');
    expect(s.isDeadReckoning).toBe(false);
  });

  it('30s tunnel: fused dead-reckons, divergence stays reasonable on return', () => {
    const tracker = new DualTracker();
    const t0 = 1_700_000_000_000;
    const speed = 20;

    for (let i = 0; i < 10; i++) {
      tracker.pushFix(
        fixNorthMeters(i * speed, t0 + i * 1000, { accuracy: 5, speed }),
      );
    }
    const beforeTunnel = tracker.getState();
    expect(beforeTunnel.fusedDistance).toBeGreaterThan(150);

    // Tunnel: 30 seconds of no fixes — only ticks
    let now = t0 + 10 * 1000;
    for (let step = 0; step < 30; step++) {
      now += 1000;
      tracker.tick(now);
    }

    const inTunnel = tracker.getState();
    expect(inTunnel.isDeadReckoning).toBe(true);
    expect(inTunnel.deadReckoningDuration).toBeGreaterThan(28000);
    expect(inTunnel.signalQuality).toBe('lost');
    // Fused kept advancing under DR
    expect(inTunnel.fusedDistance).toBeGreaterThan(beforeTunnel.fusedDistance + 400);

    // Resume fixes — pick up where DR left off
    tracker.pushFix(fixNorthMeters(40 * speed, now + 1000, { accuracy: 5, speed }));
    now += 1000;
    const afterReturn = tracker.getState();
    expect(afterReturn.isDeadReckoning).toBe(false);
    // Raw track only saw the gap as one big jump
    expect(afterReturn.rawDistance).toBeGreaterThan(750);
  });

  it('degraded signal: alternating accuracy yields smoother fused track', () => {
    const tracker = new DualTracker({ accuracyThreshold: 25 });
    const rng = mulberry32(2024);
    const t0 = 1_700_000_000_000;
    const trueSpeed = 20;
    for (let i = 0; i < 60; i++) {
      const accuracy = i % 2 === 0 ? 5 : 50;
      // bad fixes have larger position noise to simulate poor accuracy
      const noise = accuracy === 5 ? gaussian(rng, 0, 1) : gaussian(rng, 0, 25);
      tracker.pushFix(
        fixNorthMeters(i * trueSpeed + noise, t0 + i * 1000, {
          accuracy,
          speed: trueSpeed + gaussian(rng, 0, accuracy === 5 ? 0.5 : 4),
        }),
      );
    }
    const s = tracker.getState();
    // Both tracks should be roughly 1200 m, but fused has rejected the
    // bad fixes so its accumulated distance is closer to the true value.
    expect(s.rawDistance).toBeGreaterThan(1100);
    expect(Math.abs(s.fusedDistance - 1180)).toBeLessThan(120);
  });
});

describe('DualTracker — control', () => {
  it('reset() clears all accumulators', () => {
    const tracker = new DualTracker();
    const t0 = 1_700_000_000_000;
    for (let i = 0; i < 5; i++) {
      tracker.pushFix(fixNorthMeters(i * 20, t0 + i * 1000, { speed: 20 }));
    }
    tracker.reset();
    const s = tracker.getState();
    expect(s.rawDistance).toBe(0);
    expect(s.rawSpeed).toBe(0);
    expect(s.fusedDistance).toBe(0);
    expect(s.fusedSpeed).toBe(0);
    expect(s.isDeadReckoning).toBe(false);
    expect(s.deadReckoningDuration).toBe(0);
  });

  it('pause stops accumulation; resume continues', () => {
    const tracker = new DualTracker();
    const t0 = 1_700_000_000_000;
    for (let i = 0; i < 5; i++) {
      tracker.pushFix(fixNorthMeters(i * 20, t0 + i * 1000, { speed: 20 }));
    }
    const beforePause = tracker.getState();

    tracker.pause();
    // Push a fix during pause — should be ignored
    tracker.pushFix(fixNorthMeters(200, t0 + 6000, { speed: 20 }));
    tracker.tick(t0 + 7000);
    const duringPause = tracker.getState();
    expect(duringPause.rawDistance).toBe(beforePause.rawDistance);
    expect(duringPause.fusedDistance).toBe(beforePause.fusedDistance);

    tracker.resume();
    tracker.pushFix(fixNorthMeters(120, t0 + 8000, { speed: 20 }));
    const afterResume = tracker.getState();
    // Note: raw will see a jump since we fed it a fresh point relative to
    // the last pre-pause fix — that's expected behavior.
    expect(afterResume.rawDistance).toBeGreaterThan(beforePause.rawDistance);
  });
});

describe('haversine sanity inside tracker', () => {
  it('matches expected geometry for the synthetic helpers', () => {
    const a = fixNorthMeters(0, 0);
    const b = fixNorthMeters(100, 0);
    const d = haversineMeters(a.latitude, a.longitude, b.latitude, b.longitude);
    expect(Math.abs(d - 100)).toBeLessThan(0.5);
  });
});
