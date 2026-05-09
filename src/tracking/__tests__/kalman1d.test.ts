import { describe, expect, it } from 'vitest';
import { Kalman1D } from '../kalman1d';
import { gaussian, mulberry32 } from './seededRandom';

describe('Kalman1D', () => {
  it('converges on constant-velocity motion within 10 steps', () => {
    const rng = mulberry32(42);
    const k = new Kalman1D(0, 0, 1e3, 1e3);
    const trueV = 20;
    let observedS = 0;

    for (let i = 1; i <= 10; i++) {
      const dt = 1;
      observedS += trueV * dt;
      const zS = observedS + gaussian(rng, 0, 2);
      const zV = trueV + gaussian(rng, 0, 2);
      k.predict(dt, 0.1);
      k.updateBoth(zS, zV, 4, 4);
    }
    expect(Math.abs(k.v - trueV)).toBeLessThan(0.5);
  });

  it('handles distance-only updates when speed is unknown', () => {
    const rng = mulberry32(7);
    const k = new Kalman1D(0, 0, 1e3, 1e3);
    const trueV = 15;
    let observedS = 0;
    for (let i = 1; i <= 30; i++) {
      observedS += trueV;
      k.predict(1, 0.1);
      k.updateDistance(observedS + gaussian(rng, 0, 2), 4);
    }
    // Velocity should be inferred indirectly through position changes.
    expect(k.v).toBeGreaterThan(13);
    expect(k.v).toBeLessThan(17);
  });

  it('clamps state to non-negative values', () => {
    const k = new Kalman1D(5, 5, 1, 1);
    // Push observation that would drive state negative
    k.updateBoth(-100, -100, 0.01, 0.01);
    expect(k.s).toBeGreaterThanOrEqual(0);
    expect(k.v).toBeGreaterThanOrEqual(0);
  });

  it('reset returns to a clean state', () => {
    const k = new Kalman1D(100, 20);
    k.predict(1, 0.1);
    k.reset();
    expect(k.s).toBe(0);
    expect(k.v).toBe(0);
  });
});
