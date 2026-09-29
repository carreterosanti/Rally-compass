export const fmtDelta = (d: number): string => {
  if (!Number.isFinite(d)) return '0.0';
  const sign = d > 0 ? '+' : d < 0 ? '−' : '';
  return sign + Math.abs(d).toFixed(1);
};

export const fmtDist = (m: number): string => (m / 1000).toFixed(2);

/** Elapsed time with tenths: `mm:ss.d`, or `h:mm:ss.d` past one hour. */
export const fmtTime = (s: number): string => {
  if (!Number.isFinite(s) || s < 0) return '00:00.0';
  const tenths = Math.round(s * 10);
  const h = Math.floor(tenths / 36000);
  const m = Math.floor((tenths % 36000) / 600);
  const ss = Math.floor((tenths % 600) / 10);
  const d = tenths % 10;
  const mmss = `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}.${d}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
};

/** Wall-clock time of day: `hh:mm:ss`. */
export const fmtClock = (epochMs: number): string => {
  const d = new Date(epochMs);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => n.toString().padStart(2, '0'))
    .join(':');
};

/** Calendar date: `dd/mm/yyyy`. */
export const fmtDate = (epochMs: number): string => {
  const d = new Date(epochMs);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()}`;
};

export type PaceStatus = 'ON PACE' | 'LATE' | 'AHEAD';

export const statusText = (delta: number, tolerance: number): PaceStatus => {
  if (Math.abs(delta) < tolerance) return 'ON PACE';
  return delta > 0 ? 'LATE' : 'AHEAD';
};
