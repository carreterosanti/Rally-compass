import type { CSSProperties } from 'react';
import type { Role, Theme } from '../hooks/usePersistence';
import { PALETTE, alpha } from '../lib/palette';
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
  role: Role;
  setRole: (v: Role) => void;
  theme: Theme;
  setTheme: (v: Theme) => void;
  stageCount: number;
  onOpenLog: () => void;
  onStart: () => void;
};

const stepBtnStyle: CSSProperties = {
  width: 44,
  height: 44,
  background: 'transparent',
  border: `1px solid ${PALETTE.lineStrong}`,
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
  minWidth: 40,
  padding: '8px 10px',
  background: 'transparent',
  border: `1px solid ${PALETTE.line}`,
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
  role,
  setRole,
  theme,
  setTheme,
  stageCount,
  onOpenLog,
  onStart,
}: Props) {
  const adjust = (d: number) => setTargetKmh(Math.max(10, Math.min(200, targetKmh + d)));

  return (
    <div className="app-root">
      <StatusBar />
      <div
        style={{
          height: 'var(--header-h)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${PALETTE.lineFaint}`,
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: 'clamp(2px, 1vw, 5px)',
            color: PALETTE.cream,
          }}
        >
          RALLY COMPASS
        </div>
        <button
          onClick={onOpenLog}
          style={{
            position: 'absolute',
            right: 14,
            padding: '7px 10px',
            background: 'transparent',
            border: `1px solid ${PALETTE.line}`,
            borderRadius: 2,
            color: PALETTE.cream,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: 2,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          REGISTRO{stageCount > 0 ? ` · ${stageCount}` : ''}
        </button>
      </div>

      <div className="setup-body">
        <div className="setup-main">
          <div
            className="hide-short"
            style={{
              alignSelf: 'flex-start',
              marginTop: 22,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: 2.5,
              color: PALETTE.creamDim,
            }}
          >
            STAGE SETUP · 01
          </div>

          <div className="setup-dial-slot">
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

            <div className="setup-dial">
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
              marginTop: 'clamp(4px, 1.5dvh, 12px)',
            }}
          >
            <button onClick={() => adjust(-1)} style={stepBtnStyle} aria-label="Decrease">
              −
            </button>
            <div
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(60px, 13dvh, 96px)',
                lineHeight: 1,
                color: PALETTE.cream,
                letterSpacing: -3,
                fontVariantNumeric: 'tabular-nums',
                minWidth: '1.7em',
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
              marginTop: 'clamp(8px, 2dvh, 18px)',
              flexWrap: 'nowrap',
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
                  borderColor: v === targetKmh ? PALETTE.needleEdge : PALETTE.line,
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="setup-options">
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
                  padding: 'clamp(7px, 1.5dvh, 12px) 0',
                  background: opt.v === tolerance ? PALETTE.bezel : 'transparent',
                  border: `1px solid ${opt.v === tolerance ? PALETTE.needleEdge : PALETTE.line}`,
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
            <Segmented
              value={role}
              onChange={setRole}
              options={[
                { v: 'driver', label: 'CONDUCTOR' },
                { v: 'codriver', label: 'COPILOTO' },
              ]}
            />
            <Segmented
              value={theme}
              onChange={setTheme}
              options={[
                { v: 'dark', label: 'OSCURO' },
                { v: 'light', label: 'CLARO' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="screen-footer">
        <button
          onClick={onStart}
          style={{
            width: '100%',
            height: 'var(--cta-h)',
            background: `linear-gradient(180deg, ${PALETTE.ctaTop} 0%, ${PALETTE.ctaBottom} 100%)`,
            border: `1.5px solid ${PALETTE.needleEdge}`,
            borderRadius: 2,
            color: PALETTE.needle,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: 6,
            cursor: 'pointer',
            textTransform: 'uppercase',
            boxShadow: `inset 0 1px 0 ${alpha(PALETTE.needle, 15)}, 0 0 24px ${alpha(PALETTE.needle, 8)}`,
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

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ v: T; label: string }>;
}) {
  return (
    <div style={{ flex: 1, display: 'flex' }}>
      {options.map((opt, i) => {
        const active = opt.v === value;
        return (
          <button
            key={opt.v}
            onClick={() => onChange(opt.v)}
            style={{
              flex: 1,
              padding: '10px 0',
              background: active ? PALETTE.bezel : 'transparent',
              position: 'relative',
              zIndex: active ? 1 : 0,
              marginLeft: i === 0 ? 0 : -1,
              border: `1px solid ${active ? PALETTE.needleEdge : PALETTE.line}`,
              borderRadius: 2,
              color: active ? PALETTE.needle : PALETTE.creamDim,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: 1,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
