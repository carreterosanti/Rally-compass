import type { GPSState } from '../hooks/useGPSTracking';
import { PALETTE } from '../lib/palette';

/** "Acquiring" / "unavailable" banners shown over a driving screen. */
export function GpsOverlays({ gps }: { gps: GPSState }) {
  const showAcquiring =
    !gps.hasFirstFix && (gps.status === 'requesting' || gps.status === 'active');
  const showError =
    gps.status === 'denied' || gps.status === 'unavailable' || gps.status === 'error';

  return (
    <>
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
    </>
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
        top: '50%',
        transform: 'translateY(-50%)',
        padding: '14px 16px',
        background: PALETTE.overlayBg,
        border: `1px solid ${danger ? PALETTE.late : PALETTE.lineStrong}`,
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
