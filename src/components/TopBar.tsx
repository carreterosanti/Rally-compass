import type { Theme } from '../hooks/usePersistence';
import { PALETTE } from '../lib/palette';
import { GPSBars } from './GPSBars';

type Props = {
  targetSpeed: number;
  gpsBars: number;
  theme: Theme;
  onToggleTheme: () => void;
};

export function TopBar({ targetSpeed, gpsBars, theme, onToggleTheme }: Props) {
  return (
    <div
      style={{
        height: 'var(--header-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        borderBottom: `1px solid ${PALETTE.lineFaint}`,
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
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
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

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      style={{
        width: 36,
        height: 30,
        marginRight: 4,
        background: 'transparent',
        border: `1px solid ${PALETTE.line}`,
        borderRadius: 2,
        color: PALETTE.cream,
        fontSize: 16,
        lineHeight: 1,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
