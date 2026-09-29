import type { PaceState, PaceZone } from '../lib/rallyLog';
import { PALETTE } from '../lib/palette';

const ZONE_COLOR: Record<PaceZone, string> = {
  ok: PALETTE.paceOk,
  ahead: PALETTE.paceAhead,
  late: PALETTE.paceLate,
};

/** Full-screen background tint showing the pace zone. Sits behind the panels. */
export function PaceOverlay({ pace }: { pace: PaceState }) {
  // Base opacity is per theme (--pace-base-opacity): tinted at night, full in the sun.
  const extra = pace.zone === 'ok' ? 0 : pace.intensity;
  return (
    <div
      aria-hidden="true"
      className={pace.blink ? 'pace-blink' : undefined}
      style={{
        position: 'absolute',
        inset: 0,
        background: ZONE_COLOR[pace.zone],
        opacity: `calc(var(--pace-base-opacity) + (1 - var(--pace-base-opacity)) * ${extra})`,
        transition: 'background-color 150ms linear, opacity 150ms linear',
        pointerEvents: 'none',
      }}
    />
  );
}
