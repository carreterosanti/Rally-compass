import type { ReactNode } from 'react';
import { useId } from 'react';
import { PALETTE } from '../lib/palette';

type Ticks = {
  major: number[];
  minor?: number[];
  labels?: Record<string, string>;
  labelSize?: number;
};

type Props = {
  size: number;
  min: number;
  max: number;
  value: number;
  sweep?: number;
  startAngle?: number;
  ticks?: Ticks;
  cautionRange?: [number, number];
  needleColor?: string;
  faceVariant?: 'flat' | 'concentric';
  children?: ReactNode;
};

export function Dial({
  size,
  min,
  max,
  value,
  sweep = 240,
  startAngle,
  ticks,
  cautionRange,
  needleColor = PALETTE.needle,
  faceVariant = 'flat',
  children,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const span = sweep;
  const start = startAngle ?? -90 - span / 2;

  const angleFor = (v: number): number => {
    const t = (Math.max(min, Math.min(max, v)) - min) / (max - min);
    return start + t * span;
  };

  const polar = (deg: number, rad: number): { x: number; y: number } => {
    const a = (deg * Math.PI) / 180;
    return { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad };
  };

  const tickR = r - 6;
  const labelR = r - 28;
  const majorIn = tickR - 14;
  const minorIn = tickR - 8;

  const cautionPath = (() => {
    if (!cautionRange) return null;
    const [a, b] = cautionRange;
    const a1 = angleFor(a);
    const a2 = angleFor(b);
    const cInner = r - 22;
    const cOuter = r - 8;
    const p1 = polar(a1, cOuter);
    const p2 = polar(a2, cOuter);
    const p3 = polar(a2, cInner);
    const p4 = polar(a1, cInner);
    const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${cOuter} ${cOuter} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${cInner} ${cInner} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  })();

  const needleAngle = angleFor(value);
  const uid = useId().replace(/:/g, '');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`dialFace-${uid}`} cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#181410" />
          <stop offset="60%" stopColor="#0c0a07" />
          <stop offset="100%" stopColor="#050403" />
        </radialGradient>
        <filter id={`needleShadow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
          <feOffset dx="0.5" dy="1.5" result="o" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.55" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r={r} fill={`url(#dialFace-${uid})`} />
      <circle cx={cx} cy={cy} r={r - 0.5} fill="none" stroke="#2a2419" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r - 4} fill="none" stroke="#1a1610" strokeWidth="1" />

      {faceVariant === 'concentric' && (
        <circle
          cx={cx}
          cy={cy}
          r={r - 18}
          fill="none"
          stroke="rgba(212,200,168,0.04)"
          strokeWidth="0.6"
        />
      )}

      {cautionPath && <path d={cautionPath} fill={PALETTE.caution} opacity="0.85" />}

      {ticks?.minor?.map((v, i) => {
        const a = angleFor(v);
        const p1 = polar(a, tickR);
        const p2 = polar(a, minorIn);
        return (
          <line
            key={`mn-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={PALETTE.creamDim}
            strokeWidth="1"
          />
        );
      })}

      {ticks?.major.map((v, i) => {
        const a = angleFor(v);
        const p1 = polar(a, tickR);
        const p2 = polar(a, majorIn);
        return (
          <line
            key={`mj-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={PALETTE.cream}
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}

      {ticks?.labels &&
        Object.entries(ticks.labels).map(([v, txt]) => {
          const a = angleFor(parseFloat(v));
          const p = polar(a, labelR);
          return (
            <text
              key={`lb-${v}`}
              x={p.x}
              y={p.y}
              fill={PALETTE.cream}
              fontFamily="'Barlow Condensed', sans-serif"
              fontWeight="500"
              fontSize={ticks.labelSize ?? size * 0.075}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {txt}
            </text>
          );
        })}

      {children}

      <circle
        cx={cx}
        cy={cy}
        r={size * 0.055}
        fill={PALETTE.hub}
        stroke={PALETTE.hubRing}
        strokeWidth="1"
      />
      <circle cx={cx} cy={cy} r={size * 0.025} fill="#0a0806" />

      <g
        transform={`rotate(${needleAngle + 90} ${cx} ${cy})`}
        filter={`url(#needleShadow-${uid})`}
      >
        <path
          d={`M ${cx - 3} ${cy} L ${cx + 3} ${cy} L ${cx + 2} ${cy + size * 0.12} L ${cx - 2} ${cy + size * 0.12} Z`}
          fill={needleColor}
          opacity="0.85"
        />
        <path
          d={`M ${cx - 2.6} ${cy} L ${cx + 2.6} ${cy} L ${cx + 0.8} ${cy - r + 14} L ${cx - 0.8} ${cy - r + 14} Z`}
          fill={needleColor}
          stroke={PALETTE.needleEdge}
          strokeWidth="0.4"
        />
        <line
          x1={cx}
          y1={cy - 4}
          x2={cx}
          y2={cy - r + 16}
          stroke="#fff5b8"
          strokeWidth="0.5"
          opacity="0.5"
        />
      </g>

      <circle cx={cx} cy={cy} r={size * 0.022} fill="#0c0a08" />
    </svg>
  );
}
