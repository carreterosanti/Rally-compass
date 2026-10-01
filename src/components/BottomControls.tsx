import { HoldButton } from './HoldButton';

type Props = {
  onReset: () => void;
  onExit: () => void;
};

export function BottomControls({ onReset, onExit }: Props) {
  return (
    <div className="screen-footer">
      <HoldButton
        danger
        onConfirm={onReset}
        confirmTitle="¿Reiniciar tramo?"
        confirmText="El tramo actual se guarda en el Registro y arranca uno nuevo desde cero."
        confirmLabel="Reiniciar"
      >
        ↺ Reset
      </HoldButton>
      <HoldButton
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
