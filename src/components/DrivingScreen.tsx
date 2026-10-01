import type { GPSState } from '../hooks/useGPSTracking';
import type { Theme } from '../hooks/usePersistence';
import type { StageDerived } from '../hooks/useStage';
import { useWakeLock } from '../hooks/useWakeLock';
import { PALETTE } from '../lib/palette';
import { paceMessage, paceState } from '../lib/rallyLog';
import { BottomControls } from './BottomControls';
import { DriverPanel } from './DriverPanel';
import { GpsOverlays } from './GpsOverlays';
import { PaceOverlay } from './PaceOverlay';
import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';

type Props = {
  targetKmh: number;
  tolerance: number;
  theme: Theme;
  onToggleTheme: () => void;
  gps: GPSState;
  derived: StageDerived;
  onReset: () => void;
  onExit: () => void;
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

/** Driver view: raw + fused panels over a full-screen pace color. */
export function DrivingScreen({
  targetKmh,
  tolerance,
  theme,
  onToggleTheme,
  gps,
  derived,
  onReset,
  onExit,
}: Props) {
  useWakeLock(true);

  const pace = paceState(derived.fused.delta, tolerance);
  const showPace = gps.hasFirstFix;

  return (
    <div className="app-root">
      {showPace && <PaceOverlay pace={pace} />}
      <StatusBar />
      <TopBar
        targetSpeed={targetKmh}
        gpsBars={gps.gpsBars}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <div className="screen-body">
        <div className="panel-slot">
          <DriverPanel
            label="RAW GPS"
            sublabel="UNFILTERED"
            tagColor={PALETTE.cream}
            derived={derived.raw}
            tolerance={tolerance}
            compact
            neutral={showPace}
          />
        </div>

        <div className="panel-divider" style={{ background: PALETTE.lineFaint }}>
          <span
            style={{
              background: showPace ? 'transparent' : PALETTE.panelBg,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              letterSpacing: 2,
              color: gps.divergenceAlert ? PALETTE.late : PALETTE.creamFaint,
            }}
          >
            Δ {gps.divergencePercent.toFixed(1)}%{' · '}
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

        <div className="panel-slot">
          <DriverPanel
            label="KALMAN FUSED"
            sublabel="FILTERED + DR"
            tagColor={PALETTE.needle}
            derived={derived.fused}
            tolerance={tolerance}
            compact
            neutral={showPace}
            statusLabel={showPace ? (paceMessage(pace) ?? undefined) : undefined}
          />
        </div>
      </div>

      <BottomControls onReset={onReset} onExit={onExit} />
      <GpsOverlays gps={gps} />
    </div>
  );
}
