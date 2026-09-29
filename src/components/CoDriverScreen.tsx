import { useState } from 'react';
import type { GPSState } from '../hooks/useGPSTracking';
import type { Theme } from '../hooks/usePersistence';
import type { StageDerived } from '../hooks/useStage';
import { useWakeLock } from '../hooks/useWakeLock';
import { fmtDelta, fmtDist, fmtTime, statusText } from '../lib/format';
import { PALETTE, alpha } from '../lib/palette';
import { buildRows, type Stage } from '../lib/rallyLog';
import { BottomControls } from './BottomControls';
import { GpsOverlays } from './GpsOverlays';
import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';

type Props = {
  targetKmh: number;
  tolerance: number;
  theme: Theme;
  onToggleTheme: () => void;
  gps: GPSState;
  derived: StageDerived;
  stage: Stage | null;
  onMark: () => void;
  onReset: () => void;
  onExit: () => void;
};

const deltaColor = (delta: number, tolerance: number): string => {
  if (Math.abs(delta) < tolerance) return PALETTE.onpace;
  return delta > 0 ? PALETTE.textLate : PALETTE.textAhead;
};

/** Co-driver view: current deviation, last checkpoint and a huge MARCAR CP button. */
export function CoDriverScreen({
  targetKmh,
  tolerance,
  theme,
  onToggleTheme,
  gps,
  derived,
  stage,
  onMark,
  onReset,
  onExit,
}: Props) {
  useWakeLock(true);
  // Bumped on every mark to replay the button flash.
  const [flashKey, setFlashKey] = useState(0);

  const { delta, distanceM } = derived.fused;
  const dc = deltaColor(delta, tolerance);
  const rows = stage ? buildRows(stage) : [];
  const last = rows.length > 0 ? rows[rows.length - 1] : null;

  const mark = () => {
    onMark();
    setFlashKey((k) => k + 1);
  };

  return (
    <div className="app-root">
      <StatusBar />
      <TopBar
        targetSpeed={targetKmh}
        gpsBars={gps.gpsBars}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 18,
          right: 18,
          bottom: 'calc(96px + max(0px, env(safe-area-inset-bottom)))',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Current deviation (fused) */}
        <div style={{ textAlign: 'center', paddingTop: 6 }}>
          <div
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(56px, 11vh, 88px)',
              lineHeight: 1,
              color: dc,
              letterSpacing: -2,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtDelta(delta)}
            <span style={{ fontSize: '0.35em', color: PALETTE.creamDim, marginLeft: 4 }}>s</span>
          </div>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: 5,
              color: dc,
              marginTop: 2,
            }}
          >
            {statusText(delta, tolerance)}
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              color: PALETTE.cream,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtTime(derived.elapsedSec)}
            <span style={{ color: PALETTE.creamFaint }}> · </span>
            {fmtDist(distanceM)} km
          </div>
        </div>

        {/* Last checkpoint — confirms the mark was recorded */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            padding: '10px 14px',
            border: `1px solid ${PALETTE.line}`,
            borderRadius: 2,
            fontFamily: "'Barlow Condensed', sans-serif",
            color: PALETTE.creamDim,
            fontSize: 14,
            letterSpacing: 1.5,
          }}
        >
          {last ? (
            <>
              <span>
                <span style={{ color: PALETTE.cream, fontWeight: 700, fontSize: 18 }}>
                  CP {last.n}
                </span>
                {'  '}
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtTime(last.elapsedSec)}
                </span>
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: 20,
                  color: deltaColor(last.fused.diffSec, tolerance),
                }}
              >
                {fmtDelta(last.fused.diffSec)} s
              </span>
            </>
          ) : (
            <span>SIN CHECKPOINTS TODAVÍA</span>
          )}
        </div>

        {/* MARCAR CP */}
        <button
          onClick={mark}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            position: 'relative',
            overflow: 'hidden',
            flex: 1,
            minHeight: 120,
            background: `linear-gradient(180deg, ${PALETTE.ctaTop} 0%, ${PALETTE.ctaBottom} 100%)`,
            border: `2px solid ${PALETTE.needleEdge}`,
            borderRadius: 4,
            color: PALETTE.needle,
            fontFamily: "'Barlow Condensed', sans-serif",
            cursor: 'pointer',
            boxShadow: `inset 0 1px 0 ${alpha(PALETTE.needle, 15)}, 0 0 24px ${alpha(PALETTE.needle, 8)}`,
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            touchAction: 'manipulation',
          }}
        >
          {flashKey > 0 && (
            <span
              key={flashKey}
              aria-hidden="true"
              className="mark-flash"
              style={{ position: 'absolute', inset: 0, background: PALETTE.needle }}
            />
          )}
          <span style={{ position: 'relative', display: 'block', fontWeight: 700, fontSize: 'clamp(40px, 8vh, 64px)', letterSpacing: 6 }}>
            MARCAR CP
          </span>
          <span
            style={{
              position: 'relative',
              display: 'block',
              marginTop: 6,
              fontSize: 18,
              letterSpacing: 4,
              color: PALETTE.creamDim,
            }}
          >
            PRÓXIMO: CP {rows.length + 1}
          </span>
        </button>
      </div>

      <BottomControls onReset={onReset} onExit={onExit} />
      <GpsOverlays gps={gps} />
    </div>
  );
}
