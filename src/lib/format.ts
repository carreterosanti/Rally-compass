export const fmtDelta = (d: number): string => {
  if (!Number.isFinite(d)) return '0.00';
  const sign = d > 0 ? '+' : d < 0 ? '−' : '';
  return sign + Math.abs(d).toFixed(2);
};

/** Kilometres with metre resolution: `12.345`. */
export const fmtDist = (m: number): string => (m / 1000).toFixed(3);

/** Elapsed time with hundredths: `mm:ss.cc`, or `h:mm:ss.cc` past one hour. */
export const fmtTime = (s: number): string => {
  if (!Number.isFinite(s) || s < 0) return '00:00.00';
  const cs = Math.round(s * 100);
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const ss = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  const mmss = `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}.${c
    .toString()
    .padStart(2, '0')}`;
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
