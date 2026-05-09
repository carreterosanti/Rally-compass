import { PALETTE } from '../lib/palette';

type Props = {
  bars?: number;
  total?: number;
  size?: number;
};

export function GPSBars({ bars = 4, total = 5, size = 14 }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: size }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 2.5,
            height: ((i + 1) / total) * size,
            background: i < bars ? PALETTE.cream : PALETTE.creamFaint,
            borderRadius: 0.5,
          }}
        />
      ))}
    </div>
  );
}
