import { HoldButton } from './HoldButton';

// Short hold: quick to trigger mid-stage, the confirm dialog still guards it.
const HOLD_MS = 600;

type Props = {
  onReset: () => void;
  onExit: () => void;
};

export function BottomControls({ onReset, onExit }: Props) {
  return (
    <div className="screen-footer">
      <HoldButton
        holdMs={HOLD_MS}
        danger
        onConfirm={onReset}
        confirmTitle="¿Reiniciar tramo?"
        confirmText="El tramo actual se guarda en el Registro y arranca uno nuevo desde cero."
        confirmLabel="Reiniciar"
      >
        ↺ Reset
      </HoldButton>
      <HoldButton
        holdMs={HOLD_MS}
        onConfirm={onExit}
        confirmTitle="¿Salir del tramo?"
        confirmText="El tramo actual se guarda en el Registro y volvés a la configuración."
        confirmLabel="Salir"
      >
        ✕ Salir
      </HoldButton>
    </div>
  );
}
