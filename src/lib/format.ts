export const fmtDelta = (d: number): string => {
  if (!Number.isFinite(d)) return '0.0';
  const sign = d > 0 ? '+' : d < 0 ? '−' : '';
  return sign + Math.abs(d).toFixed(1);
};

export const fmtDist = (m: number): string => (m / 1000).toFixed(2);

export const fmtTime = (s: number): string => {
  if (!Number.isFinite(s) || s < 0) return '00:00';
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
};

export type PaceStatus = 'ON PACE' | 'LATE' | 'AHEAD';

export const statusText = (delta: number, tolerance: number): PaceStatus => {
  if (Math.abs(delta) < tolerance) return 'ON PACE';
  return delta > 0 ? 'LATE' : 'AHEAD';
};
