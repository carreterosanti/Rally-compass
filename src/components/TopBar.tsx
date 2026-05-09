import { PALETTE } from '../lib/palette';
import { GPSBars } from './GPSBars';

type Props = {
  targetSpeed: number;
  gpsBars: number;
  paused?: boolean;
};

export function TopBar({ targetSpeed, gpsBars, paused }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 38,
        left: 0,
        right: 0,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        borderBottom: '1px solid rgba(212,200,168,0.08)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 500,
            fontSize: 11,
            letterSpacing: 1.6,
            color: PALETTE.creamDim,
            textTransform: 'uppercase',
          }}
        >
          TARGET
        </div>
        <div
          style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: 22,
            color: PALETTE.cream,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {targetSpeed.toFixed(0)}
          <span
            style={{
              fontSize: 11,
              letterSpacing: 1.4,
              color: PALETTE.creamDim,
              marginLeft: 4,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            KM/H
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {paused && (
          <div
            style={{
              fontSize: 10,
              letterSpacing: 1.4,
              color: PALETTE.late,
              padding: '3px 6px',
              border: `1px solid ${PALETTE.late}`,
              borderRadius: 1,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            PAUSED
          </div>
        )}
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 500,
            fontSize: 10,
            letterSpacing: 1.2,
            color: PALETTE.creamDim,
          }}
        >
          GPS
        </div>
        <GPSBars bars={gpsBars} total={5} size={14} />
      </div>
    </div>
  );
}
