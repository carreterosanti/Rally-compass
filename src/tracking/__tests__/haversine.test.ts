import { describe, expect, it } from 'vitest';
import { haversineMeters } from '../haversine';

describe('haversineMeters', () => {
  it('returns 0 for the same point', () => {
    expect(haversineMeters(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it('matches a known 1km distance along the equator', () => {
    // 1 degree of longitude at the equator ≈ 111319.5 m
    // 1km ≈ 0.0089832° lon
    const d = haversineMeters(0, 0, 0, 0.0089832);
    expect(d).toBeGreaterThan(995);
    expect(d).toBeLessThan(1005);
  });

  it('matches a known 1km distance north–south', () => {
    // 1° latitude is ~110.574 km. 1km north = ~0.009° lat.
    const d = haversineMeters(0, 0, 0.009, 0);
    expect(d).toBeGreaterThan(995);
    expect(d).toBeLessThan(1005);
  });

  it('is symmetric', () => {
    const a = haversineMeters(48.8566, 2.3522, 51.5074, -0.1278); // Paris → London
    const b = haversineMeters(51.5074, -0.1278, 48.8566, 2.3522);
    expect(a).toBeCloseTo(b, 6);
  });

  it('Paris → London is approximately 343–345 km', () => {
    const d = haversineMeters(48.8566, 2.3522, 51.5074, -0.1278);
    expect(d / 1000).toBeGreaterThan(340);
    expect(d / 1000).toBeLessThan(346);
  });
});
