/**
 * 1D constant-velocity Kalman filter.
 *
 * State vector  x = [s, v]    (position / accumulated distance, velocity).
 * Covariance    P  ∈ ℝ²ˣ²
 *
 * Prediction model (constant velocity):
 *   F = | 1  dt |
 *       | 0   1 |
 *
 * Process noise:
 *   Q = q · | dt³/3   dt²/2 |
 *           | dt²/2   dt    |
 *
 * Observations:
 *   • updateBoth(z_s, z_v, R_s, R_v)  — H = I, full state observation
 *   • updateDistance(z_s, R_s)        — H = [1 0], distance only
 *
 * Implementation notes:
 *   - All matrix math is unrolled (no allocations) so each call is O(1).
 *   - `s` and `v` are clamped to ≥ 0 after each update — distances and
 *     ground speed cannot go negative for our use case.
 */

type Mat2 = [number, number, number, number]; // row-major: [a, b, c, d]

const EPSILON = 1e-12;

export class Kalman1D {
  s: number;
  v: number;
  /** Covariance, row-major [P00, P01, P10, P11] */
  P: Mat2;

  constructor(s = 0, v = 0, initialPosVar = 1e3, initialVelVar = 1e3) {
    this.s = s;
    this.v = v;
    this.P = [initialPosVar, 0, 0, initialVelVar];
  }

  reset(s = 0, v = 0, initialPosVar = 1e3, initialVelVar = 1e3): void {
    this.s = s;
    this.v = v;
    this.P = [initialPosVar, 0, 0, initialVelVar];
  }

  /**
   * Time update.
   * @param dt           seconds since last predict
   * @param processNoise scalar Q magnitude (>= 0)
   */
  predict(dt: number, processNoise: number): void {
    if (dt <= 0) return;

    // x_pred = F · x
    this.s = this.s + this.v * dt;
    // v stays

    // F·P
    const a = this.P[0] + dt * this.P[2];
    const b = this.P[1] + dt * this.P[3];
    const c = this.P[2];
    const d = this.P[3];

    // (F·P)·Fᵀ ; Fᵀ = [[1,0],[dt,1]]
    let p00 = a + dt * b;
    let p01 = b;
    let p10 = c + dt * d;
    let p11 = d;

    // + Q
    const dt2 = dt * dt;
    const dt3 = dt2 * dt;
    p00 += processNoise * (dt3 / 3);
    p01 += processNoise * (dt2 / 2);
    p10 += processNoise * (dt2 / 2);
    p11 += processNoise * dt;

    this.P = [p00, p01, p10, p11];
  }

  /**
   * Measurement update with both distance and velocity (H = I).
   * @param z_s observed accumulated distance (meters)
   * @param z_v observed velocity (m/s)
   * @param R_s variance of distance observation
   * @param R_v variance of velocity observation
   */
  updateBoth(z_s: number, z_v: number, R_s: number, R_v: number): void {
    // Innovation
    const y_s = z_s - this.s;
    const y_v = z_v - this.v;

    // S = P + R
    const s00 = this.P[0] + R_s;
    const s01 = this.P[1];
    const s10 = this.P[2];
    const s11 = this.P[3] + R_v;

    const det = s00 * s11 - s01 * s10;
    if (Math.abs(det) < EPSILON) return;
    const inv = 1 / det;
    const sInv00 = s11 * inv;
    const sInv01 = -s01 * inv;
    const sInv10 = -s10 * inv;
    const sInv11 = s00 * inv;

    // K = P · S⁻¹  (since H = I)
    const k00 = this.P[0] * sInv00 + this.P[1] * sInv10;
    const k01 = this.P[0] * sInv01 + this.P[1] * sInv11;
    const k10 = this.P[2] * sInv00 + this.P[3] * sInv10;
    const k11 = this.P[2] * sInv01 + this.P[3] * sInv11;

    // x = x + K·y
    this.s = this.s + k00 * y_s + k01 * y_v;
    this.v = this.v + k10 * y_s + k11 * y_v;

    // P = (I − K) · P
    const im00 = 1 - k00;
    const im01 = -k01;
    const im10 = -k10;
    const im11 = 1 - k11;

    const newP00 = im00 * this.P[0] + im01 * this.P[2];
    const newP01 = im00 * this.P[1] + im01 * this.P[3];
    const newP10 = im10 * this.P[0] + im11 * this.P[2];
    const newP11 = im10 * this.P[1] + im11 * this.P[3];

    this.P = [newP00, newP01, newP10, newP11];

    if (this.s < 0) this.s = 0;
    if (this.v < 0) this.v = 0;
  }

  /**
   * Measurement update with distance only (H = [1, 0]).
   * Used when GPS does not report velocity (`fix.speed === null`).
   */
  updateDistance(z_s: number, R_s: number): void {
    // S (scalar) = P00 + R
    const S = this.P[0] + R_s;
    if (Math.abs(S) < EPSILON) return;

    // K = [P00/S, P10/S]
    const k0 = this.P[0] / S;
    const k1 = this.P[2] / S;

    const y = z_s - this.s;

    this.s = this.s + k0 * y;
    this.v = this.v + k1 * y;

    // P ← (I − K·H) · P    where K·H = [[k0,0],[k1,0]]
    const newP00 = (1 - k0) * this.P[0];
    const newP01 = (1 - k0) * this.P[1];
    const newP10 = -k1 * this.P[0] + this.P[2];
    const newP11 = -k1 * this.P[1] + this.P[3];

    this.P = [newP00, newP01, newP10, newP11];

    if (this.s < 0) this.s = 0;
    if (this.v < 0) this.v = 0;
  }
}
