import { useEffect, useRef } from 'react';

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
};

type WakeLockApi = {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
};

export function useWakeLock(active: boolean) {
  const sentinel = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    const wakeLock = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
    if (!wakeLock) return;

    let cancelled = false;

    const acquire = async () => {
      try {
        const s = await wakeLock.request('screen');
        if (cancelled) {
          await s.release().catch(() => {});
          return;
        }
        sentinel.current = s;
        s.addEventListener('release', () => {
          if (sentinel.current === s) sentinel.current = null;
        });
      } catch {
        // user gesture may be required; silent fallback
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && active && !sentinel.current) {
        void acquire();
      }
    };

    if (active) void acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (sentinel.current) {
        sentinel.current.release().catch(() => {});
        sentinel.current = null;
      }
    };
  }, [active]);
}
