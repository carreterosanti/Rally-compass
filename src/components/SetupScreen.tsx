import type { CSSProperties } from 'react';
import { PALETTE } from '../lib/palette';
import { Dial } from './Dial';
import { StatusBar } from './StatusBar';

const PRESETS = [30, 50, 70, 90, 110] as const;
const TOLERANCE_OPTIONS: ReadonlyArray<{ label: string; v: number }> = [
  { label: 'TIGHT', v: 0.5 },
  { label: 'NORMAL', v: 1.5 },
  { label: 'LOOSE', v: 3 },
];

type Props = {
  targetKmh: number;
  setTargetKmh: (v: number) => void;
  tolerance: number;
  setTolerance: (v: number) => void;
  audioAlerts: boolean;
  setAudioAlerts: (v: boolean) => void;
  vibrateAlerts: boolean;
  setVibrateAlerts: (v: boolean) => void;
  onStart: () => void;
};

const stepBtnStyle: CSSProperties = {
  width: 44,
  height: 44,
  background: 'transparent',
  border: '1px solid rgba(212,200,168,0.25)',
  borderRadius: 22,
  color: PALETTE.cream,
  fontFamily: "'Barlow', sans-serif",
  fontSize: 28,
  fontWeight: 400,
  lineHeight: 1,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
};

const presetBtnStyle: CSSProperties = {
  minWidth: 44,
  padding: '8px 12px',
  background: 'transparent',
  border: '1px solid rgba(212,200,168,0.18)',
  borderRadius: 2,
  color: PALETTE.cream,
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 600,
  fontSize: 14,
  letterSpacing: 1,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
};

export function SetupScreen({
  targetKmh,
  setTargetKmh,
  tolerance,
  setTolerance,
  audioAlerts,
  setAudioAlerts,
  vibrateAlerts,
  setVibrateAlerts,
  onStart,
}: Props) {
  const adjust = (d: number) => setTargetKmh(Math.max(10, Math.min(200, targetKmh + d)));

  return (
    <div className="app-root">
      <StatusBar />
      <div
        style={{
          position: 'absolute',
          top: 38,
          left: 0,
          right: 0,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(212,200,168,0.08)',
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: 5,
            color: PALETTE.cream,
          }}
        >
          RALLY COMPASS
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 116,
          left: 24,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 500,
          fontSize: 11,
          letterSpacing: 2.5,
          color: PALETTE.creamDim,
        }}
      >
        STAGE SETUP · 01
      </div>

      <div
        style={{
          position: 'absolute',
          top: 154,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 500,
            fontSize: 12,
            letterSpacing: 3,
            color: PALETTE.creamDim,
            marginBottom: 6,
          }}
        >
          TARGET AVERAGE SPEED
        </div>

        <div
          style={{
            position: 'relative',
            width: 320,
            height: 180,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Dial
              size={300}
              min={0}
              max={120}
              value={targetKmh}
              sweep={200}
              startAngle={-180}
              ticks={{
                major: [0, 20, 40, 60, 80, 100, 120],
                minor: Array.from({ length: 13 }, (_, i) => i * 10).filter((v) => v % 20 !== 0),
                labels: {
                  '0': '0',
                  '20': '20',
                  '40': '40',
                  '60': '60',
                  '80': '80',
                  '100': '100',
                  '120': '120',
                },
                labelSize: 16,
              }}
            />
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginTop: 12,
          }}
        >
          <button onClick={() => adjust(-1)} style={stepBtnStyle} aria-label="Decrease">
            −
          </button>
          <div
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 700,
              fontSize: 96,
              lineHeight: 1,
              color: PALETTE.cream,
              letterSpacing: -3,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 160,
              textAlign: 'center',
            }}
          >
            {targetKmh.toFixed(0)}
            <span
              style={{
                fontSize: 20,
                color: PALETTE.creamDim,
                marginLeft: 6,
                letterSpacing: 0,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              KM/H
            </span>
          </div>
          <button onClick={() => adjust(1)} style={stepBtnStyle} aria-label="Increase">
            +
          </button>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            gap: 8,
            marginTop: 18,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {PRESETS.map((v) => (
            <button
              key={v}
              onClick={() => setTargetKmh(v)}
              style={{
                ...presetBtnStyle,
                background: v === targetKmh ? PALETTE.bezel : 'transparent',
                color: v === targetKmh ? PALETTE.needle : PALETTE.cream,
                borderColor:
                  v === targetKmh ? PALETTE.needleEdge : 'rgba(212,200,168,0.18)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', top: 590, left: 24, right: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: 2.5,
              color: PALETTE.creamDim,
            }}
          >
            ALERT TOLERANCE
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              fontSize: 14,
              color: PALETTE.cream,
            }}
          >
            ±{tolerance.toFixed(1)}s
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {TOLERANCE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setTolerance(opt.v)}
              style={{
                flex: 1,
                padding: '12px 0',
                background: opt.v === tolerance ? PALETTE.bezel : 'transparent',
                border: `1px solid ${
                  opt.v === tolerance ? PALETTE.needleEdge : 'rgba(212,200,168,0.18)'
                }`,
                borderRadius: 2,
                color: opt.v === tolerance ? PALETTE.needle : PALETTE.cream,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: 2,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              {opt.label}
              <div
                style={{
                  fontSize: 9,
                  color: PALETTE.creamDim,
                  fontWeight: 400,
                  marginTop: 2,
                }}
              >
                ±{opt.v}s
              </div>
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 14,
          }}
        >
          <ToggleChip
            active={audioAlerts}
            onClick={() => setAudioAlerts(!audioAlerts)}
            label="AUDIO ALERTS"
          />
          <ToggleChip
            active={vibrateAlerts}
            onClick={() => setVibrateAlerts(!vibrateAlerts)}
            label="VIBRATE"
          />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 'max(24px, env(safe-area-inset-bottom))', left: 18, right: 18 }}>
        <button
          onClick={onStart}
          style={{
            width: '100%',
            height: 64,
            background: 'linear-gradient(180deg, #2a1f0c 0%, #1a1408 100%)',
            border: `1.5px solid ${PALETTE.needleEdge}`,
            borderRadius: 2,
            color: PALETTE.needle,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: 6,
            cursor: 'pointer',
            textTransform: 'uppercase',
            boxShadow:
              'inset 0 1px 0 rgba(245,198,58,0.15), 0 0 24px rgba(245,198,58,0.08)',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          ▶ START STAGE
        </button>
      </div>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 0',
        background: active ? PALETTE.bezel : 'transparent',
        border: `1px solid ${active ? PALETTE.needleEdge : 'rgba(212,200,168,0.18)'}`,
        borderRadius: 2,
        color: active ? PALETTE.needle : PALETTE.creamDim,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: 2,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      {label} {active ? 'ON' : 'OFF'}
    </button>
  );
}
