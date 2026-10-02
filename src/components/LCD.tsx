import { PALETTE } from '../lib/palette';

type Props = {
  digits: string;
  width: string | number;
  /** px or any CSS length (e.g. a clamp() in container units). */
  height: number | string;
  /** Digit size; labels scale from it. px or any CSS length. */
  fontSize: number | string;
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
        background: `linear-gradient(180deg, ${PALETTE.lcdBgEdge} 0%, ${PALETTE.lcdBg} 50%, ${PALETTE.lcdBgBottom} 100%)`,
        border: `1px solid ${PALETTE.lcdBorder}`,
        boxShadow: `inset 0 2px 4px ${PALETTE.needleShadow}, inset 0 -1px 0 ${PALETTE.lineFaint}`,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `0 ${padX}px`,
        overflow: 'hidden',
        fontSize,
        fontVariantNumeric: 'tabular-nums',
        boxSizing: 'border-box',
      }}
    >
      {label && (
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '0.32em',
            color: PALETTE.creamDim,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 1,
          }}
        >
          {label}
        </div>
      )}
      {/* Digits shrink when a long readout (e.g. `123.456`) would clip:
          each monospace glyph is ~0.6em wide plus 1px letter-spacing. */}
      <div style={{ width: '100%', containerType: 'inline-size' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            textAlign: align,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: `min(1em, calc((100cqw - ${txt.length}px) / ${(txt.length * 0.62).toFixed(2)}))`,
            fontWeight: 500,
            color: PALETTE.lcdDigit,
            letterSpacing: 1,
            lineHeight: 1,
            textShadow: `0 0 6px ${PALETTE.lcdDigitDim}`,
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
      </div>
      {sublabel && (
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '0.3em',
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
