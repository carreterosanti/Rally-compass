import { useState } from 'react';
import { DrivingScreen } from './components/DrivingScreen';
import { SetupScreen } from './components/SetupScreen';
import { useSettings } from './hooks/usePersistence';
import { useStage } from './hooks/useStage';

type Mode = 'setup' | 'driving';

export default function App() {
  const [mode, setMode] = useState<Mode>('setup');
  const [settings, setSettings] = useSettings();

  const { gps, derived, controller } = useStage(settings.targetKmh);

  const setTargetKmh = (v: number) => setSettings((s) => ({ ...s, targetKmh: v }));
  const setTolerance = (v: number) => setSettings((s) => ({ ...s, toleranceSec: v }));
  const setAudio = (v: boolean) => setSettings((s) => ({ ...s, audioAlerts: v }));
  const setVibrate = (v: boolean) => setSettings((s) => ({ ...s, vibrateAlerts: v }));

  const startStage = () => {
    setMode('driving');
    controller.start();
  };

  const exitToSetup = () => {
    controller.exit();
    setMode('setup');
  };

  if (mode === 'setup') {
    return (
      <SetupScreen
        targetKmh={settings.targetKmh}
        setTargetKmh={setTargetKmh}
        tolerance={settings.toleranceSec}
        setTolerance={setTolerance}
        audioAlerts={settings.audioAlerts}
        setAudioAlerts={setAudio}
        vibrateAlerts={settings.vibrateAlerts}
        setVibrateAlerts={setVibrate}
        onStart={startStage}
      />
    );
  }

  return (
    <DrivingScreen
      targetKmh={settings.targetKmh}
      tolerance={settings.toleranceSec}
      audioAlerts={settings.audioAlerts}
      vibrateAlerts={settings.vibrateAlerts}
      gps={gps}
      derived={derived}
      controller={{ ...controller, exit: exitToSetup }}
    />
  );
}
