import type { PanelDerived } from '../hooks/useStage';
import { fmtDelta, fmtDist, statusText } from '../lib/format';
import { PALETTE } from '../lib/palette';
import { Dial } from './Dial';
import { LCD } from './LCD';
import { PrintedLabel } from './PrintedLabel';

type Props = {
  label: string;
  sublabel?: string;
  /** Tag color shown next to the label, optional */
  tagColor?: string;
  derived: PanelDerived;
  tolerance: number;
  /** Compact size — for stacked dual view */
  compact?: boolean;
};

function statusColor(delta: number, tolerance: number): string {
  if (Math.abs(delta) < tolerance) return PALETTE.onpace;
  return delta > 0 ? PALETTE.late : PALETTE.ahead;
}

const DELTA_RANGE_S = 10;

export function DriverPanel({
  label,
  sublabel,
  tagColor,
  derived,
  tolerance,
  compact = false,
}: Props) {
  if (compact) {
    return (
      <CompactPanel
        label={label}
        sublabel={sublabel}
        tagColor={tagColor}
        derived={derived}
        tolerance={tolerance}
      />
    );
  }
  return (
    <FullPanel
      label={label}
      sublabel={sublabel}
      tagColor={tagColor}
      derived={derived}
      tolerance={tolerance}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Compact variant — used when two panels share the screen.
// Optimized for at-a-glance readability while driving.
// ─────────────────────────────────────────────────────────────────
function CompactPanel({
  label,
  sublabel,
  tagColor,
  derived,
  tolerance,
}: Omit<Props, 'compact'>) {
  const { delta, distanceM, currentSpeedKmh } = derived;
  const sc = statusColor(delta, tolerance);
  const status = statusText(delta, tolerance);

  // Needle position on horizontal scale, clamped to ±DELTA_RANGE_S
  const t = Math.max(-DELTA_RANGE_S, Math.min(DELTA_RANGE_S, delta));
  const needlePct = ((t + DELTA_RANGE_S) / (2 * DELTA_RANGE_S)) * 100;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 18px 12px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11,
          letterSpacing: 2.5,
          color: PALETTE.creamDim,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tagColor && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 1,
                background: tagColor,
                boxShadow: `0 0 6px ${tagColor}80`,
              }}
            />
          )}
          {label}
        </span>
        {sublabel && <span style={{ color: PALETTE.creamFaint }}>{sublabel}</span>}
      </div>

      {/* Horizontal needle bar — quick visual cue */}
      <div
        style={{
          position: 'relative',
          marginTop: 8,
          height: 22,
          background: 'linear-gradient(180deg, #181410 0%, #0c0a07 100%)',
          border: '1px solid #2a2419',
          borderRadius: 2,
          boxShadow: 'inset 0 1px 0 rgba(212,200,168,0.05)',
        }}
      >
        {/* caution band — center */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${50 - (tolerance / DELTA_RANGE_S) * 50}%`,
            right: `${50 - (tolerance / DELTA_RANGE_S) * 50}%`,
            background: PALETTE.caution,
            opacity: 0.18,
          }}
        />
        {/* center dashed line */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: '50%',
            width: 1,
            background: `repeating-linear-gradient(to bottom, ${PALETTE.creamDim} 0 2px, transparent 2px 4px)`,
          }}
        />
        {/* needle */}
        <div
          style={{
            position: 'absolute',
            top: -3,
            bottom: -3,
            left: `calc(${needlePct}% - 1.5px)`,
            width: 3,
            background: sc,
            boxShadow: `0 0 8px ${sc}`,
            borderRadius: 1,
            transition: 'left 120ms linear',
          }}
        />
        {/* end caps */}
        <span
          style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 9,
            letterSpacing: 1.5,
            color: PALETTE.creamFaint,
          }}
        >
          ◀ AHEAD
        </span>
        <span
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 9,
            letterSpacing: 1.5,
            color: PALETTE.creamFaint,
          }}
        >
          LATE ▶
        </span>
      </div>

      {/* HERO — gigantic delta + status */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(72px, 18vh, 132px)',
            lineHeight: 0.95,
            color: sc,
            letterSpacing: -3,
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 36px ${sc}55`,
          }}
        >
          {fmtDelta(delta)}
          <span
            style={{
              fontSize: '0.35em',
              color: PALETTE.creamDim,
              marginLeft: 4,
              letterSpacing: 0,
            }}
          >
            s
          </span>
        </div>
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(20px, 3.5vh, 30px)',
            letterSpacing: 6,
            color: sc,
            marginTop: 4,
          }}
        >
          {status}
        </div>
      </div>

      {/* LCDs — much larger digits */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          gap: 10,
          marginTop: 6,
        }}
      >
        <LCD
          digits={fmtDist(distanceM)}
          width="100%"
          height={92}
          fontSize={50}
          label="DISTANCE"
          sublabel="KM"
          padX={12}
        />
        <LCD
          digits={currentSpeedKmh.toFixed(0)}
          width="100%"
          height={92}
          fontSize={50}
          label="SPEED"
          sublabel="KM/H"
          padX={12}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Full-size single-panel variant (kept for fallback / single-track view)
// ─────────────────────────────────────────────────────────────────
function FullPanel({
  label,
  sublabel,
  tagColor,
  derived,
  tolerance,
}: Omit<Props, 'compact'>) {
  const { delta, distanceM, currentSpeedKmh } = derived;
  const sc = statusColor(delta, tolerance);
  const dialSize = 290;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11,
          letterSpacing: 2.5,
          color: PALETTE.creamDim,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tagColor && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 1,
                background: tagColor,
                boxShadow: `0 0 6px ${tagColor}80`,
              }}
            />
          )}
          {label}
        </span>
        {sublabel && <span style={{ color: PALETTE.creamFaint }}>{sublabel}</span>}
      </div>

      <Dial
        size={dialSize}
        min={-10}
        max={10}
        value={delta}
        sweep={240}
        ticks={{
          major: [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10],
          minor: Array.from({ length: 41 }, (_, i) => -10 + i * 0.5).filter(
            (v) => v % 2 !== 0,
          ),
          labels: { '-10': '10', '-5': '5', '0': '0', '5': '5', '10': '10' },
          labelSize: 22,
        }}
        cautionRange={[-tolerance, tolerance]}
        faceVariant="concentric"
      >
        <PrintedLabel x={dialSize * 0.32} y={dialSize * 0.34} size={10}>
          AHEAD
        </PrintedLabel>
        <PrintedLabel x={dialSize * 0.68} y={dialSize * 0.34} size={10}>
          LATE
        </PrintedLabel>
        <PrintedLabel x={dialSize / 2} y={dialSize * 0.78} size={9}>
          SECONDS · DELTA
        </PrintedLabel>
      </Dial>

      <div
        style={{
          marginTop: 18,
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 600,
          fontSize: 96,
          lineHeight: 1,
          color: sc,
          letterSpacing: -2,
          fontVariantNumeric: 'tabular-nums',
          textShadow: `0 0 24px ${sc}33`,
        }}
      >
        {fmtDelta(delta)}
        <span
          style={{
            fontSize: 38,
            color: PALETTE.creamDim,
            marginLeft: 6,
            letterSpacing: 0,
          }}
        >
          s
        </span>
      </div>
      <div
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: 5,
          color: sc,
          marginTop: 4,
        }}
      >
        {statusText(delta, tolerance)}
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          gap: 10,
          marginTop: 24,
          padding: '0 18px',
          boxSizing: 'border-box',
        }}
      >
        <LCD
          digits={fmtDist(distanceM)}
          width="100%"
          height={108}
          fontSize={56}
          label="DISTANCE"
          sublabel="KM"
          padX={14}
        />
        <LCD
          digits={currentSpeedKmh.toFixed(0)}
          width="100%"
          height={108}
          fontSize={56}
          label="SPEED"
          sublabel="KM/H"
          padX={14}
        />
      </div>
    </div>
  );
}
