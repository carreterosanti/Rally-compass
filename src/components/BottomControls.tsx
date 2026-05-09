import type { ReactNode } from 'react';
import { PALETTE } from '../lib/palette';

type BtnProps = {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
};

function Btn({ children, onClick, primary, danger }: BtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: 56,
        background: primary ? PALETTE.bezel : 'transparent',
        border: `1px solid ${primary ? PALETTE.needleEdge : 'rgba(212,200,168,0.18)'}`,
        borderRadius: 2,
        color: primary ? PALETTE.needle : danger ? PALETTE.late : PALETTE.cream,
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
      {children}
    </button>
  );
}

type Props = {
  paused: boolean;
  onToggle: () => void;
  onReset: () => void;
  onExit?: () => void;
};

export function BottomControls({ paused, onToggle, onReset, onExit }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'max(24px, env(safe-area-inset-bottom))',
        left: 18,
        right: 18,
        display: 'flex',
        gap: 10,
      }}
    >
      <Btn onClick={onToggle} primary={!paused}>
        {paused ? '▶ Resume' : '❚❚ Pause'}
      </Btn>
      <Btn onClick={onReset} danger>
        ↺ Reset
      </Btn>
      {onExit && <Btn onClick={onExit}>✕ Exit</Btn>}
    </div>
  );
}
