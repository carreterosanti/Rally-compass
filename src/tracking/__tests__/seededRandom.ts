/**
 * Deterministic helpers for reproducible test sequences.
 *
 * `mulberry32` PRNG and Box-Muller transform — both seedable.
 */

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rng: () => number, mean = 0, sigma = 1): number {
  // Box-Muller — guard against u1=0 which would log to -Infinity.
  let u1 = rng();
  while (u1 === 0) u1 = rng();
  const u2 = rng();
  const mag = Math.sqrt(-2 * Math.log(u1));
  return mean + sigma * mag * Math.cos(2 * Math.PI * u2);
}
