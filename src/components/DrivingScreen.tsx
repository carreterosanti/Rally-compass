import { useEffect } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import type { GPSState } from '../hooks/useGPSTracking';
import type { StageController, StageDerived } from '../hooks/useStage';
import { useWakeLock } from '../hooks/useWakeLock';
import { PALETTE } from '../lib/palette';
import { BottomControls } from './BottomControls';
import { DriverPanel } from './DriverPanel';
import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';

type Props = {
  targetKmh: number;
  tolerance: number;
  audioAlerts: boolean;
  vibrateAlerts: boolean;
  gps: GPSState;
  derived: StageDerived;
  controller: StageController;
};

const SIGNAL_LABELS: Record<GPSState['signalQuality'], string> = {
  good: 'GOOD',
  fair: 'FAIR',
  poor: 'POOR',
  lost: 'LOST',
};

const SIGNAL_COLORS: Record<GPSState['signalQuality'], string> = {
  good: PALETTE.ahead,
  fair: PALETTE.onpace,
  poor: PALETTE.late,
  lost: PALETTE.late,
};

export function DrivingScreen({
  targetKmh,
  tolerance,
  audioAlerts,
  vibrateAlerts,
  gps,
  derived,
  controller,
}: Props) {
  const fusedDelta = derived.fused.delta;
  const paused = controller.status === 'paused';

  useWakeLock(controller.status === 'running');
  useAlerts({
    delta: fusedDelta,
    tolerance,
    enabled: audioAlerts,
    vibrate: vibrateAlerts,
    active: controller.status === 'running',
  });

  useEffect(() => {
    if (controller.status === 'idle') {
      controller.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showAcquiring =
    !gps.hasFirstFix && (gps.status === 'requesting' || gps.status === 'active');
  const showError =
    gps.status === 'denied' || gps.status === 'unavailable' || gps.status === 'error';

  return (
    <div className="app-root">
      <StatusBar />
      <TopBar targetSpeed={targetKmh} gpsBars={gps.gpsBars} paused={paused} />

      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          bottom: 'calc(96px + max(0px, env(safe-area-inset-bottom)))',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <DriverPanel
            label="RAW GPS"
            sublabel="UNFILTERED"
            tagColor={PALETTE.cream}
            derived={derived.raw}
            tolerance={tolerance}
            compact
          />
        </div>

        <div
          style={{
            height: 1,
            background: 'rgba(212,200,168,0.10)',
            margin: '0 18px',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: -10,
              transform: 'translateX(-50%)',
              padding: '2px 10px',
              background: '#0d0b08',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              letterSpacing: 2,
              color: gps.divergenceAlert ? PALETTE.late : PALETTE.creamFaint,
            }}
          >
            Δ {gps.divergencePercent.toFixed(1)}%
            {' · '}
            <span style={{ color: SIGNAL_COLORS[gps.signalQuality] }}>
              {SIGNAL_LABELS[gps.signalQuality]}
            </span>
            {gps.isDeadReckoning && (
              <>
                {' · '}
                <span style={{ color: PALETTE.late }}>
                  DR {Math.round(gps.deadReckoningDuration / 1000)}s
                </span>
              </>
            )}
          </span>
        </div>

        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <DriverPanel
            label="KALMAN FUSED"
            sublabel="FILTERED + DR"
            tagColor={PALETTE.needle}
            derived={derived.fused}
            tolerance={tolerance}
            compact
          />
        </div>
      </div>

      <BottomControls
        paused={paused}
        onToggle={() => (paused ? controller.resume() : controller.pause())}
        onReset={controller.reset}
        onExit={controller.exit}
      />

      {showAcquiring && (
        <Overlay title="ACQUIRING GPS…" subtitle="Hold steady · move outdoors for a fix" />
      )}
      {showError && (
        <Overlay
          title="GPS UNAVAILABLE"
          subtitle={
            gps.status === 'denied'
              ? 'Permission denied · enable location to continue'
              : gps.errorMessage ?? 'Could not acquire a position'
          }
          danger
        />
      )}
    </div>
  );
}

function Overlay({
  title,
  subtitle,
  danger,
}: {
  title: string;
  subtitle?: string;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 18,
        right: 18,
        bottom: 'calc(220px + max(0px, env(safe-area-inset-bottom)))',
        padding: '14px 16px',
        background: 'rgba(13,11,8,0.92)',
        border: `1px solid ${danger ? PALETTE.late : 'rgba(212,200,168,0.25)'}`,
        borderRadius: 2,
        color: danger ? PALETTE.late : PALETTE.cream,
        fontFamily: "'Barlow Condensed', sans-serif",
        textAlign: 'center',
        zIndex: 10,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: 3 }}>{title}</div>
      {subtitle && (
        <div style={{ marginTop: 4, fontSize: 12, color: PALETTE.creamDim, letterSpacing: 1 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
