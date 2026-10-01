import { useState } from 'react';
import { ArmedScreen } from './components/ArmedScreen';
import { CoDriverScreen } from './components/CoDriverScreen';
import { DrivingScreen } from './components/DrivingScreen';
import { LogScreen } from './components/LogScreen';
import { SetupScreen } from './components/SetupScreen';
import { useSettings } from './hooks/usePersistence';
import { useRallyLog } from './hooks/useRallyLog';
import { useStage } from './hooks/useStage';
import { useTheme } from './hooks/useTheme';

type Mode = 'setup' | 'armed' | 'driving' | 'log';

export default function App() {
  const [mode, setMode] = useState<Mode>('setup');
  const [settings, setSettings] = useSettings();
  const rally = useRallyLog();

  useTheme(settings.theme);

  const { gps, derived, controller } = useStage(settings.targetKmh);

  const setTargetKmh = (v: number) => setSettings((s) => ({ ...s, targetKmh: v }));
  const setTolerance = (v: number) => setSettings((s) => ({ ...s, toleranceSec: v }));
  const setRole = (v: typeof settings.role) => setSettings((s) => ({ ...s, role: v }));
  const setTheme = (v: typeof settings.theme) => setSettings((s) => ({ ...s, theme: v }));
  const toggleTheme = () =>
    setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));

  // START and RESET both begin a fresh stage; beginning one archives the previous.
  const beginStage = () => {
    const startedAt = controller.start();
    rally.begin(settings.targetKmh, startedAt);
  };

  // START STAGE only arms: the clock starts with the tap on the armed screen.
  const armStage = () => {
    controller.arm();
    setMode('armed');
  };

  const cancelArmed = () => {
    controller.exit();
    setMode('setup');
  };

  const exitToSetup = () => {
    rally.finish();
    controller.exit();
    setMode('setup');
  };

  const markCheckpoint = () =>
    rally.mark({
      wallTime: Date.now(),
      elapsedSec: controller.elapsedNow(),
      fusedM: gps.fused.distanceM,
      rawM: gps.raw.distanceM,
    });

  if (mode === 'log') {
    return (
      <LogScreen
        stages={rally.log.stages}
        onRename={rally.rename}
        onClear={rally.clear}
        onBack={() => setMode('setup')}
      />
    );
  }

  if (mode === 'setup') {
    return (
      <SetupScreen
        targetKmh={settings.targetKmh}
        setTargetKmh={setTargetKmh}
        tolerance={settings.toleranceSec}
        setTolerance={setTolerance}
        role={settings.role}
        setRole={setRole}
        theme={settings.theme}
        setTheme={setTheme}
        stageCount={rally.log.stages.length}
        onOpenLog={() => setMode('log')}
        onStart={armStage}
      />
    );
  }

  if (mode === 'armed') {
    return (
      <ArmedScreen
        targetKmh={settings.targetKmh}
        role={settings.role}
        theme={settings.theme}
        onToggleTheme={toggleTheme}
        gps={gps}
        onStart={beginStage}
        onGo={() => setMode('driving')}
        onCancel={cancelArmed}
      />
    );
  }

  const common = {
    targetKmh: settings.targetKmh,
    tolerance: settings.toleranceSec,
    theme: settings.theme,
    onToggleTheme: toggleTheme,
    gps,
    derived,
    onReset: beginStage,
    onExit: exitToSetup,
  };

  return settings.role === 'codriver' ? (
    <CoDriverScreen {...common} stage={rally.log.active} onMark={markCheckpoint} />
  ) : (
    <DrivingScreen {...common} />
  );
}
