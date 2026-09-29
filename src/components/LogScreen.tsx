import { useState, type CSSProperties, type ReactNode } from 'react';
import { fmtClock, fmtDate, fmtDelta, fmtDist, fmtTime } from '../lib/format';
import { PALETTE } from '../lib/palette';
import { buildRows, type Stage } from '../lib/rallyLog';
import { shareStageImage } from '../lib/shareImage';
import { HoldButton } from './HoldButton';
import { StatusBar } from './StatusBar';

type Props = {
  stages: Stage[];
  onRename: (id: string, name: string) => void;
  onClear: () => void;
  onBack: () => void;
};

const labelFont: CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  letterSpacing: 2,
};

const mono: CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontVariantNumeric: 'tabular-nums',
};

const diffColor = (d: number): string =>
  d > 0.05 ? PALETTE.textLate : d < -0.05 ? PALETTE.textAhead : PALETTE.cream;

/** Stage archive: list of stages → checkpoint table, screenshot-friendly, shareable as PNG. */
export function LogScreen({ stages, onRename, onClear, onBack }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stages.find((s) => s.id === selectedId) ?? null;

  if (selected) {
    return (
      <StageDetail stage={selected} onRename={onRename} onBack={() => setSelectedId(null)} />
    );
  }

  const newestFirst = [...stages].reverse();

  return (
    <Frame title="REGISTRO" backLabel="‹ Setup" onBack={onBack}>
      <div className="scroll-y" style={{ flex: 1, minHeight: 0, padding: '12px 18px' }}>
        {newestFirst.length === 0 && (
          <div style={{ ...labelFont, color: PALETTE.creamDim, fontSize: 15, marginTop: 24 }}>
            Todavía no hay tramos. Cada tramo con checkpoints se guarda acá al hacer RESET o SALIR.
          </div>
        )}
        {newestFirst.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              marginBottom: 10,
              padding: '14px 16px',
              background: 'transparent',
              border: `1px solid ${PALETTE.line}`,
              borderRadius: 2,
              color: PALETTE.cream,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ ...labelFont, fontWeight: 700, fontSize: 20 }}>{s.name}</div>
            <div style={{ ...labelFont, fontSize: 13, color: PALETTE.creamDim, marginTop: 4 }}>
              {fmtDate(s.startedAt)} · {fmtClock(s.startedAt)} · {s.targetKmh.toFixed(0)} KM/H ·{' '}
              {s.checkpoints.length} CP
              {s.interrupted && <span style={{ color: PALETTE.late }}> · INTERRUMPIDO</span>}
            </div>
          </button>
        ))}
      </div>
      <BottomBar>
        <HoldButton
          danger
          disabled={stages.length === 0}
          onConfirm={onClear}
          confirmTitle="¿Nuevo rally?"
          confirmText="Se borran todos los tramos del Registro. No se puede deshacer."
          confirmLabel="Borrar todo"
        >
          Nuevo rally
        </HoldButton>
      </BottomBar>
    </Frame>
  );
}

function StageDetail({
  stage,
  onRename,
  onBack,
}: {
  stage: Stage;
  onRename: (id: string, name: string) => void;
  onBack: () => void;
}) {
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const rows = buildRows(stage);

  const rename = () => {
    const name = window.prompt('Nombre del tramo', stage.name);
    if (name != null) onRename(stage.id, name);
  };

  const share = async () => {
    setSharing(true);
    setShareError(null);
    try {
      await shareStageImage(stage);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'No se pudo compartir');
    } finally {
      setSharing(false);
    }
  };

  const col = { cp: 34, km: 62, time: 84, dif: 64 };

  return (
    <Frame title="TRAMO" backLabel="‹ Tramos" onBack={onBack}>
      <div className="scroll-y" style={{ flex: 1, minHeight: 0, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...labelFont, fontWeight: 700, fontSize: 26, color: PALETTE.cream, flex: 1 }}>
            {stage.name}
          </div>
          <button
            onClick={rename}
            style={{
              ...labelFont,
              padding: '6px 10px',
              background: 'transparent',
              border: `1px solid ${PALETTE.line}`,
              borderRadius: 2,
              color: PALETTE.creamDim,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            ✎ RENOMBRAR
          </button>
        </div>
        <div style={{ ...labelFont, fontSize: 14, color: PALETTE.creamDim, marginTop: 4 }}>
          {stage.targetKmh.toFixed(0)} KM/H · {fmtDate(stage.startedAt)} · START{' '}
          {fmtClock(stage.startedAt)}
        </div>
        {stage.interrupted && (
          <div style={{ ...labelFont, fontSize: 12, color: PALETTE.late, marginTop: 4 }}>
            INTERRUMPIDO — la app se cerró durante el tramo
          </div>
        )}

        {/* Table head */}
        <div
          style={{
            ...labelFont,
            display: 'flex',
            marginTop: 16,
            paddingBottom: 6,
            fontSize: 11,
            color: PALETTE.creamFaint,
            borderBottom: `2px solid ${PALETTE.cream}`,
          }}
        >
          <span style={{ width: col.cp }}>CP</span>
          <span style={{ width: col.km, textAlign: 'right' }}>KM</span>
          <span style={{ flex: 1, textAlign: 'right' }}>REAL</span>
          <span style={{ flex: 1, textAlign: 'right' }}>IDEAL</span>
          <span style={{ width: col.dif, textAlign: 'right' }}>DIF</span>
        </div>

        {rows.length === 0 && (
          <div style={{ ...labelFont, color: PALETTE.creamDim, fontSize: 14, marginTop: 12 }}>
            Sin checkpoints
          </div>
        )}

        {rows.map((r) => (
          <div
            key={r.n}
            style={{ padding: '8px 0', borderBottom: `1px solid ${PALETTE.lineFaint}` }}
          >
            <div style={{ ...mono, display: 'flex', fontSize: 15, color: PALETTE.cream }}>
              <span style={{ width: col.cp, fontWeight: 700 }}>{r.n}</span>
              <span style={{ width: col.km, textAlign: 'right' }}>{fmtDist(r.fused.distanceM)}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>{fmtTime(r.elapsedSec)}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>{fmtTime(r.fused.idealSec)}</span>
              <span
                style={{
                  width: col.dif,
                  textAlign: 'right',
                  fontWeight: 700,
                  color: diffColor(r.fused.diffSec),
                }}
              >
                {fmtDelta(r.fused.diffSec)}
              </span>
            </div>
            <div style={{ ...mono, fontSize: 11, color: PALETTE.creamDim, marginTop: 3, paddingLeft: col.cp }}>
              parcial {fmtTime(r.partialSec)} / ideal {fmtTime(r.fused.partialIdealSec)} ·{' '}
              {r.fused.partialAvgKmh.toFixed(1)} km/h
            </div>
            <div style={{ ...mono, fontSize: 11, color: PALETTE.creamFaint, marginTop: 2, paddingLeft: col.cp }}>
              raw {fmtDist(r.raw.distanceM)} km · ideal {fmtTime(r.raw.idealSec)} · dif{' '}
              {fmtDelta(r.raw.diffSec)}
            </div>
          </div>
        ))}

        <div style={{ ...labelFont, fontSize: 11, color: PALETTE.creamFaint, marginTop: 10, letterSpacing: 1 }}>
          + = atrasado · − = adelantado · distancias GPS fused (Kalman)
        </div>
      </div>

      <BottomBar>
        <button
          onClick={share}
          disabled={sharing}
          style={{
            flex: 1,
            height: 56,
            background: PALETTE.bezel,
            border: `1.5px solid ${PALETTE.needleEdge}`,
            borderRadius: 2,
            color: PALETTE.needle,
            ...labelFont,
            fontWeight: 700,
            fontSize: 16,
            textTransform: 'uppercase',
            cursor: 'pointer',
            opacity: sharing ? 0.5 : 1,
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          {sharing ? 'Generando…' : '⇪ Compartir imagen'}
        </button>
      </BottomBar>
      {shareError && (
        <div
          style={{
            ...labelFont,
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: 'calc(92px + max(0px, env(safe-area-inset-bottom)))',
            fontSize: 12,
            color: PALETTE.late,
            textAlign: 'center',
          }}
        >
          {shareError}
        </div>
      )}
    </Frame>
  );
}

function Frame({
  title,
  backLabel,
  onBack,
  children,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="app-root">
      <StatusBar />
      <div
        style={{
          position: 'absolute',
          top: 38,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            position: 'relative',
            height: 56,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${PALETTE.lineFaint}`,
          }}
        >
          <button
            onClick={onBack}
            style={{
              ...labelFont,
              position: 'absolute',
              left: 12,
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              color: PALETTE.creamDim,
              fontSize: 14,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {backLabel}
          </button>
          <div style={{ ...labelFont, fontWeight: 600, fontSize: 14, letterSpacing: 5, color: PALETTE.cream }}>
            {title}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        gap: 10,
        padding: '12px 18px max(24px, env(safe-area-inset-bottom))',
        borderTop: `1px solid ${PALETTE.lineFaint}`,
      }}
    >
      {children}
    </div>
  );
}
