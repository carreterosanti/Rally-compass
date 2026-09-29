import { useCallback, useEffect, useState } from 'react';
import {
  EMPTY_LOG,
  addCheckpoint,
  archiveActive,
  beginStage,
  renameStage,
  restoreLog,
  type Checkpoint,
  type RallyLog,
} from '../lib/rallyLog';

const KEY = 'rally-compass.log.v1';

function load(): RallyLog {
  if (typeof window === 'undefined') return EMPTY_LOG;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? restoreLog(JSON.parse(raw)) : EMPTY_LOG;
  } catch {
    return EMPTY_LOG;
  }
}

export type RallyLogApi = {
  log: RallyLog;
  begin: (targetKmh: number, startedAt: number) => void;
  mark: (cp: Checkpoint) => void;
  finish: () => void;
  rename: (id: string, name: string) => void;
  clear: () => void;
};

export function useRallyLog(): RallyLogApi {
  const [log, setLog] = useState<RallyLog>(load);

  // Written on every change so a checkpoint survives the app being killed.
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(log));
    } catch {
      // ignore quota / private mode
    }
  }, [log]);

  const begin = useCallback(
    (targetKmh: number, startedAt: number) => setLog((l) => beginStage(l, targetKmh, startedAt)),
    [],
  );
  const mark = useCallback((cp: Checkpoint) => setLog((l) => addCheckpoint(l, cp)), []);
  const finish = useCallback(() => setLog((l) => archiveActive(l)), []);
  const rename = useCallback(
    (id: string, name: string) => setLog((l) => renameStage(l, id, name)),
    [],
  );
  const clear = useCallback(() => setLog(EMPTY_LOG), []);

  return { log, begin, mark, finish, rename, clear };
}
