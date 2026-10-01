import { useRef } from 'react';
import type { GPSState } from '../hooks/useGPSTracking';
import type { Role, Theme } from '../hooks/usePersistence';
import { useWakeLock } from '../hooks/useWakeLock';
import { PALETTE, alpha } from '../lib/palette';
import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';

type Props = {
  targetKmh: number;
  role: Role;
  theme: Theme;
  onToggleTheme: () => void;
  gps: GPSState;
  /** Starts the stage clock. Called on touch-down, the exact moment of the start. */
  onStart: () => void;
  /** Leaves this screen once the finger lifts. */
  onGo: () => void;
  onCancel: () => void;
};

function gpsLine(gps: GPSState): { text: string; color: string } {
  if (gps.status === 'denied') return { text: 'GPS SIN PERMISO', color: PALETTE.late };
  if (gps.status === 'unavailable' || gps.status === 'error') {
    return { text: 'GPS NO DISPONIBLE', color: PALETTE.late };
  }
  if (gps.hasFirstFix) return { text: 'GPS LISTO', color: PALETTE.onpace };
  return { text: 'BUSCANDO GPS…', color: PALETTE.creamDim };
}

/**
 * Waiting at the start line: the whole body is one button, so the start
 * can be triggered without looking. The clock starts on touch-down for
 * precision; the screen switches on release so the same tap can't land
 * on a button of the next screen.
 */
export function ArmedScreen({
  targetKmh,
  role,
  theme,
  onToggleTheme,
  gps,
  onStart,
  onGo,
  onCancel,
}: Props) {
  useWakeLock(true);
  const started = useRef(false);

  const start = () => {
    if (started.current) return;
    started.current = true;
    onStart();
  };

  const go = () => {
    start();
    onGo();
  };

  const status = gpsLine(gps);

  return (
    <div className="app-root">
      <StatusBar />
      <TopBar
        targetSpeed={targetKmh}
        gpsBars={gps.gpsBars}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <button
        className="armed-trigger"
        onPointerDown={start}
        onPointerCancel={() => started.current && onGo()}
        onClick={go}
        style={{
          background: `linear-gradient(180deg, ${PALETTE.ctaTop} 0%, ${PALETTE.ctaBottom} 100%)`,
          border: `1.5px solid ${PALETTE.needleEdge}`,
          color: PALETTE.needle,
          boxShadow: `inset 0 1px 0 ${alpha(PALETTE.needle, 15)}, 0 0 32px ${alpha(PALETTE.needle, 10)}`,
        }}
      >
        <span style={{ fontSize: 'clamp(13px, 2.2dvh, 16px)', letterSpacing: 3, color: PALETTE.creamDim }}>
          {role === 'codriver' ? 'COPILOTO' : 'CONDUCTOR'} · {targetKmh.toFixed(0)} KM/H
        </span>
        <span
          style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(40px, min(12dvh, 14vw), 120px)',
            letterSpacing: 'clamp(2px, 1vw, 10px)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          ▶ LARGAR
        </span>
        <span style={{ fontSize: 'clamp(14px, 2.4dvh, 18px)', letterSpacing: 1.5, color: PALETTE.cream }}>
          Tocá en cualquier parte para iniciar el tramo
        </span>
        <span style={{ fontSize: 'clamp(13px, 2.2dvh, 16px)', letterSpacing: 3, color: status.color }}>
          {status.text}
        </span>
      </button>

      <div className="screen-footer">
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            height: 'var(--btn-h)',
            background: 'transparent',
            border: `1px solid ${PALETTE.line}`,
            borderRadius: 2,
            color: PALETTE.cream,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          ✕ Cancelar
        </button>
      </div>
    </div>
  );
}
