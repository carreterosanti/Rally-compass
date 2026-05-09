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

export function DriverPanel({
  label,
  sublabel,
  tagColor,
  derived,
  tolerance,
  compact = false,
}: Props) {
  const { delta, distanceM, currentSpeedKmh } = derived;
  const sc = statusColor(delta, tolerance);
  const dialSize = compact ? 168 : 290;
  const deltaFontSize = compact ? 52 : 76;
  const lcdHeight = compact ? 72 : 108;
  const lcdFontSize = compact ? 36 : 56;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: compact ? '10px 18px 14px' : '0',
        boxSizing: 'border-box',
      }}
    >
      {/* Panel header label */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11,
          letterSpacing: 2.5,
          color: PALETTE.creamDim,
          marginBottom: compact ? 4 : 0,
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

      {/* Dial + delta */}
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: compact ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: compact ? 'space-between' : 'center',
          gap: compact ? 14 : 12,
        }}
      >
        <Dial
          size={dialSize}
          min={-10}
          max={10}
          value={delta}
          sweep={240}
          ticks={{
            major: compact ? [-10, -5, 0, 5, 10] : [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10],
            minor: compact
              ? Array.from({ length: 21 }, (_, i) => -10 + i).filter((v) => v % 5 !== 0)
              : Array.from({ length: 41 }, (_, i) => -10 + i * 0.5).filter((v) => v % 2 !== 0),
            labels: { '-10': '10', '-5': '5', '0': '0', '5': '5', '10': '10' },
            labelSize: compact ? 12 : 22,
          }}
          cautionRange={[-tolerance, tolerance]}
          faceVariant="concentric"
        >
          {!compact && (
            <>
              <PrintedLabel x={dialSize * 0.32} y={dialSize * 0.34} size={10}>
                AHEAD
              </PrintedLabel>
              <PrintedLabel x={dialSize * 0.68} y={dialSize * 0.34} size={10}>
                LATE
              </PrintedLabel>
              <PrintedLabel x={dialSize / 2} y={dialSize * 0.78} size={9}>
                SECONDS · DELTA
              </PrintedLabel>
            </>
          )}
        </Dial>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 700,
              fontSize: deltaFontSize,
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
                fontSize: deltaFontSize * 0.4,
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
              fontWeight: 600,
              fontSize: compact ? 14 : 18,
              letterSpacing: 4,
              color: sc,
            }}
          >
            {statusText(delta, tolerance)}
          </div>
        </div>
      </div>

      {/* LCDs */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          gap: 10,
          marginTop: compact ? 8 : 16,
        }}
      >
        <LCD
          digits={fmtDist(distanceM)}
          width="100%"
          height={lcdHeight}
          fontSize={lcdFontSize}
          label="DISTANCE"
          sublabel="KM"
          padX={12}
        />
        <LCD
          digits={currentSpeedKmh.toFixed(0)}
          width="100%"
          height={lcdHeight}
          fontSize={lcdFontSize}
          label="SPEED"
          sublabel="KM/H"
          padX={12}
        />
      </div>
    </div>
  );
}
