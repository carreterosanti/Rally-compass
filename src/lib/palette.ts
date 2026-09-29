// Every color resolves to a CSS custom property so the dark / light
// themes can swap at runtime. Values live in styles/app.css.
export const PALETTE = {
  panelBg: 'var(--c-panel-bg)',
  dialBg: 'var(--c-dial-bg)',
  dialBgOuter: 'var(--c-dial-bg-outer)',
  dialFace1: 'var(--c-dial-face-1)',
  dialFace2: 'var(--c-dial-face-2)',
  dialFace3: 'var(--c-dial-face-3)',
  dialRing: 'var(--c-dial-ring)',
  dialRingInner: 'var(--c-dial-ring-inner)',
  dialPin: 'var(--c-dial-pin)',
  cream: 'var(--c-cream)',
  creamDim: 'var(--c-cream-dim)',
  creamFaint: 'var(--c-cream-faint)',
  needle: 'var(--c-needle)',
  needleEdge: 'var(--c-needle-edge)',
  needleShadow: 'var(--c-needle-shadow)',
  bezel: 'var(--c-bezel)',
  bezelEdge: 'var(--c-bezel-edge)',
  hub: 'var(--c-hub)',
  hubRing: 'var(--c-hub-ring)',
  lcdBg: 'var(--c-lcd-bg)',
  lcdBgEdge: 'var(--c-lcd-bg-edge)',
  lcdBgBottom: 'var(--c-lcd-bg-bottom)',
  lcdBorder: 'var(--c-lcd-border)',
  lcdDigit: 'var(--c-lcd-digit)',
  lcdDigitDim: 'var(--c-lcd-digit-dim)',
  trackBgTop: 'var(--c-track-bg-top)',
  trackBgBottom: 'var(--c-track-bg-bottom)',
  trackBorder: 'var(--c-track-border)',
  lineFaint: 'var(--c-line-faint)',
  line: 'var(--c-line)',
  lineStrong: 'var(--c-line-strong)',
  overlayBg: 'var(--c-overlay-bg)',
  ctaTop: 'var(--c-cta-top)',
  ctaBottom: 'var(--c-cta-bottom)',
  caution: 'var(--c-caution)',
  late: 'var(--c-late)',
  ahead: 'var(--c-ahead)',
  onpace: 'var(--c-onpace)',
  paceOk: 'var(--c-pace-ok)',
  paceAhead: 'var(--c-pace-ahead)',
  paceLate: 'var(--c-pace-late)',
  /** Readable text colors matching the pace zones (ahead = red, late = violet). */
  textAhead: 'var(--c-text-ahead)',
  textLate: 'var(--c-text-late)',
} as const;

export type PaletteColor = (typeof PALETTE)[keyof typeof PALETTE];

/** Translucent version of any color (works with CSS variables). */
export const alpha = (color: string, pct: number): string =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;
