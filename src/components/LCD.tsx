import { PALETTE } from '../lib/palette';

type Props = {
  digits: string;
  width: string | number;
  height: number;
  fontSize: number;
  label?: string;
  sublabel?: string;
  ghost?: boolean;
  align?: 'left' | 'center' | 'right';
  padX?: number;
};

export function LCD({
  digits,
  width,
  height,
  fontSize,
  label,
  sublabel,
  ghost = true,
  align = 'center',
  padX = 10,
}: Props) {
  const txt = String(digits);
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        background: `linear-gradient(180deg, ${PALETTE.lcdBgEdge} 0%, ${PALETTE.lcdBg} 50%, #0d0e08 100%)`,
        border: '1px solid #2a2a18',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(212,200,168,0.04)',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `0 ${padX}px`,
        overflow: 'hidden',
        fontVariantNumeric: 'tabular-nums',
        boxSizing: 'border-box',
      }}
    >
      {label && (
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: fontSize * 0.32,
            color: PALETTE.creamDim,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 1,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          width: '100%',
          textAlign: align,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize,
          fontWeight: 500,
          color: PALETTE.lcdDigit,
          letterSpacing: 1,
          lineHeight: 1,
          textShadow: '0 0 6px rgba(230,211,154,0.18)',
        }}
      >
        {ghost && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              color: PALETTE.lcdDigitDim,
              pointerEvents: 'none',
            }}
          >
            {'8'.repeat(txt.length)}
          </div>
        )}
        <div style={{ position: 'relative' }}>{txt}</div>
      </div>
      {sublabel && (
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: fontSize * 0.3,
            color: PALETTE.creamDim,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginTop: 1,
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}
