import { useEffect, useState } from 'react';

const KEY = 'rally-compass.v1';

export type Role = 'driver' | 'codriver';
export type Theme = 'dark' | 'light';

export type Settings = {
  targetKmh: number;
  toleranceSec: number;
  role: Role;
  theme: Theme;
};

const DEFAULTS: Settings = {
  targetKmh: 50,
  toleranceSec: 1.5,
  role: 'driver',
  theme: 'dark',
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
      role: parsed.role === 'driver' || parsed.role === 'codriver' ? parsed.role : DEFAULTS.role,
      theme: parsed.theme === 'dark' || parsed.theme === 'light' ? parsed.theme : DEFAULTS.theme,
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
