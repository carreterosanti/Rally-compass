import { useEffect, useState } from 'react';
import { PALETTE } from '../lib/palette';

function formatClock(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function StatusBar() {
  const [time, setTime] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(formatClock(new Date())), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        fontFamily: "'Barlow Semi Condensed', sans-serif",
        fontWeight: 600,
        fontSize: 14,
        color: PALETTE.cream,
        pointerEvents: 'none',
      }}
    >
      <span>{time}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.85 }}>
        <span style={{ fontSize: 11, letterSpacing: 0.5 }}>RALLY</span>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <rect x="0.5" y="0.5" width="13" height="9" rx="1.2" stroke={PALETTE.cream} />
          <rect x="2" y="2" width="10" height="6" rx="0.4" fill={PALETTE.cream} />
          <rect x="14" y="3" width="1.5" height="4" rx="0.5" fill={PALETTE.cream} />
        </svg>
      </span>
    </div>
  );
}
