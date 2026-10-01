import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { PALETTE, alpha } from '../lib/palette';

const DEFAULT_HOLD_MS = 2000;

type Props = {
  children: ReactNode;
  /** Title of the confirmation dialog shown after the hold completes. */
  confirmTitle: string;
  confirmText?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** How long the button must be held before the dialog opens. */
  holdMs?: number;
  style?: CSSProperties;
};

/**
 * Destructive action guard: press and hold (a bar fills up), then
 * confirm in a dialog. Hard to trigger by accident in a bouncing car.
 */
export function HoldButton({
  children,
  confirmTitle,
  confirmText,
  confirmLabel = 'Confirmar',
  onConfirm,
  danger,
  disabled,
  holdMs = DEFAULT_HOLD_MS,
  style,
}: Props) {
  const [holding, setHolding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<number | null>(null);

  const cancelHold = () => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  useEffect(() => cancelHold, []);

  const startHold = () => {
    if (disabled) return;
    cancelHold();
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      setConfirming(true);
    }, holdMs);
  };

  const color = danger ? PALETTE.late : PALETTE.cream;

  return (
    <>
      <button
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled}
        style={{
          position: 'relative',
          overflow: 'hidden',
          flex: 1,
          height: 'var(--btn-h)',
          background: 'transparent',
          border: `1px solid ${PALETTE.line}`,
          borderRadius: 2,
          color,
          opacity: disabled ? 0.4 : 1,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: 2,
          textTransform: 'uppercase',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          touchAction: 'manipulation',
          ...style,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: holding ? '100%' : '0%',
            background: alpha(color, 25),
            transition: holding ? `width ${holdMs}ms linear` : 'none',
          }}
        />
        <span style={{ position: 'relative' }}>{children}</span>
        <span
          style={{
            position: 'relative',
            display: 'block',
            fontSize: 9,
            letterSpacing: 1.5,
            color: PALETTE.creamFaint,
            marginTop: 1,
          }}
        >
          {holding ? 'mantené…' : `mantener ${(holdMs / 1000).toLocaleString('es')} s`}
        </span>
      </button>

      {confirming && (
        <ConfirmDialog
          title={confirmTitle}
          text={confirmText}
          confirmLabel={confirmLabel}
          danger={danger}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onConfirm();
          }}
        />
      )}
    </>
  );
}

function ConfirmDialog({
  title,
  text,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}: {
  title: string;
  text?: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const btn: CSSProperties = {
    flex: 1,
    height: 56,
    borderRadius: 2,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        background: PALETTE.overlayBg,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 20,
          background: PALETTE.panelBg,
          border: `1px solid ${danger ? PALETTE.late : PALETTE.lineStrong}`,
          borderRadius: 2,
          fontFamily: "'Barlow Condensed', sans-serif",
          color: PALETTE.cream,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: 2 }}>{title}</div>
        {text && (
          <div style={{ marginTop: 8, fontSize: 15, color: PALETTE.creamDim, letterSpacing: 0.5 }}>
            {text}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={onCancel}
            style={{
              ...btn,
              background: 'transparent',
              border: `1px solid ${PALETTE.line}`,
              color: PALETTE.cream,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...btn,
              background: PALETTE.bezel,
              border: `1.5px solid ${danger ? PALETTE.late : PALETTE.needleEdge}`,
              color: danger ? PALETTE.late : PALETTE.needle,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
