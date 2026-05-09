import type { ReactNode } from 'react';
import { PALETTE } from '../lib/palette';

type Props = {
  x: number;
  y: number;
  size?: number;
  color?: string;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  children: ReactNode;
};

export function PrintedLabel({
  x,
  y,
  size = 10,
  color = PALETTE.creamDim,
  weight = 500,
  anchor = 'middle',
  children,
}: Props) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontFamily="'Barlow Condensed', sans-serif"
      fontWeight={weight}
      fontSize={size}
      textAnchor={anchor}
      dominantBaseline="central"
      letterSpacing="1.2"
      style={{ textTransform: 'uppercase' }}
    >
      {children}
    </text>
  );
}
