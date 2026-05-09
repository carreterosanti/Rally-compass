import { useEffect, useState } from 'react';

const KEY = 'rally-compass.v1';

export type Settings = {
  targetKmh: number;
  toleranceSec: number;
  audioAlerts: boolean;
  vibrateAlerts: boolean;
};

const DEFAULTS: Settings = {
  targetKmh: 50,
  toleranceSec: 1.5,
  audioAlerts: true,
  vibrateAlerts: true,
};

function load(): Settings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      targetKmh:
        typeof parsed.targetKmh === 'number' && parsed.targetKmh > 0
          ? parsed.targetKmh
          : DEFAULTS.targetKmh,
      toleranceSec:
        typeof parsed.toleranceSec === 'number' && parsed.toleranceSec > 0
          ? parsed.toleranceSec
          : DEFAULTS.toleranceSec,
      audioAlerts:
        typeof parsed.audioAlerts === 'boolean' ? parsed.audioAlerts : DEFAULTS.audioAlerts,
      vibrateAlerts:
        typeof parsed.vibrateAlerts === 'boolean'
          ? parsed.vibrateAlerts
          : DEFAULTS.vibrateAlerts,
    };
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      // ignore quota / private mode
    }
  }, [settings]);

  return [settings, setSettings] as const;
}
