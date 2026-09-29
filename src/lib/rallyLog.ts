// Checkpoint log for a rally: pure data + calculations, no React / DOM.
//
// A stage is timed from the START tap. Each checkpoint captures the
// stage clock and both GPS distances (fused + raw) at the moment the
// co-driver taps MARCAR CP. The ideal time at a checkpoint is the time
// a car holding exactly `targetKmh` would need to cover that distance.

export type Checkpoint = {
  /** Epoch ms when the checkpoint was marked (wall clock). */
  wallTime: number;
  /** Stage clock at the mark, seconds since START. */
  elapsedSec: number;
  fusedM: number;
  rawM: number;
};

export type Stage = {
  id: string;
  name: string;
  targetKmh: number;
  /** Epoch ms of the START tap. */
  startedAt: number;
  checkpoints: Checkpoint[];
  /** The app was closed mid-stage; GPS distance after the last CP is lost. */
  interrupted?: boolean;
};

export type RallyLog = {
  /** Finished stages, oldest first. */
  stages: Stage[];
  /** Stage currently being driven, if any. */
  active: Stage | null;
};

export const EMPTY_LOG: RallyLog = { stages: [], active: null };

export const idealSecFor = (distanceM: number, targetKmh: number): number =>
  distanceM > 0 && targetKmh > 0 ? (distanceM / 1000 / targetKmh) * 3600 : 0;

export const avgKmh = (distanceM: number, sec: number): number =>
  sec > 0 ? distanceM / 1000 / (sec / 3600) : 0;

// ─────────────────────────────────────────────────────────────────
// Table rows
// ─────────────────────────────────────────────────────────────────

export type Measure = {
  distanceM: number;
  idealSec: number;
  /** real − ideal. Positive = late, negative = ahead. */
  diffSec: number;
  partialDistanceM: number;
  partialIdealSec: number;
  partialAvgKmh: number;
};

export type CheckpointRow = {
  n: number;
  wallTime: number;
  elapsedSec: number;
  partialSec: number;
  fused: Measure;
  raw: Measure;
};

function measure(
  distanceM: number,
  prevDistanceM: number,
  elapsedSec: number,
  partialSec: number,
  targetKmh: number,
): Measure {
  const idealSec = idealSecFor(distanceM, targetKmh);
  const partialDistanceM = distanceM - prevDistanceM;
  return {
    distanceM,
    idealSec,
    diffSec: elapsedSec - idealSec,
    partialDistanceM,
    partialIdealSec: idealSec - idealSecFor(prevDistanceM, targetKmh),
    partialAvgKmh: avgKmh(partialDistanceM, partialSec),
  };
}

export function buildRows(stage: Stage): CheckpointRow[] {
  return stage.checkpoints.map((cp, i) => {
    const prev = i > 0 ? stage.checkpoints[i - 1] : null;
    const partialSec = cp.elapsedSec - (prev?.elapsedSec ?? 0);
    return {
      n: i + 1,
      wallTime: cp.wallTime,
      elapsedSec: cp.elapsedSec,
      partialSec,
      fused: measure(cp.fusedM, prev?.fusedM ?? 0, cp.elapsedSec, partialSec, stage.targetKmh),
      raw: measure(cp.rawM, prev?.rawM ?? 0, cp.elapsedSec, partialSec, stage.targetKmh),
    };
  });
}

// ─────────────────────────────────────────────────────────────────
// Full-screen pace color
// ─────────────────────────────────────────────────────────────────

export type PaceZone = 'ok' | 'ahead' | 'late';

export type PaceState = {
  zone: PaceZone;
  /** 0 at the tolerance edge → 1 at 3× tolerance. Always 0 inside tolerance. */
  intensity: number;
  /** Deviation is beyond 2× tolerance. */
  blink: boolean;
};

export function paceState(delta: number, tolerance: number): PaceState {
  const abs = Math.abs(delta);
  if (!Number.isFinite(delta) || abs <= tolerance) {
    return { zone: 'ok', intensity: 0, blink: false };
  }
  return {
    zone: delta < 0 ? 'ahead' : 'late',
    intensity: Math.min(1, (abs - tolerance) / (2 * tolerance)),
    blink: abs > 2 * tolerance,
  };
}

const PACE_MESSAGE: Record<PaceZone, string | null> = {
  ok: null,
  ahead: 'FRENÁ',
  late: 'ACELERÁ',
};

/** What the driver should do: FRENÁ / ACELERÁ, or null when on pace. */
export const paceMessage = (pace: PaceState): string | null => PACE_MESSAGE[pace.zone];

// ─────────────────────────────────────────────────────────────────
// Log operations (immutable)
// ─────────────────────────────────────────────────────────────────

const newId = (startedAt: number): string =>
  `${startedAt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Move the active stage to the archive. Stages without checkpoints are dropped. */
export function archiveActive(log: RallyLog, interrupted = false): RallyLog {
  if (!log.active) return log;
  if (log.active.checkpoints.length === 0) return { ...log, active: null };
  const archived: Stage = interrupted ? { ...log.active, interrupted: true } : log.active;
  return { stages: [...log.stages, archived], active: null };
}

export function beginStage(log: RallyLog, targetKmh: number, startedAt: number): RallyLog {
  const base = archiveActive(log);
  return {
    ...base,
    active: {
      id: newId(startedAt),
      name: `Tramo ${base.stages.length + 1}`,
      targetKmh,
      startedAt,
      checkpoints: [],
    },
  };
}

export function addCheckpoint(log: RallyLog, cp: Checkpoint): RallyLog {
  if (!log.active) return log;
  return { ...log, active: { ...log.active, checkpoints: [...log.active.checkpoints, cp] } };
}

export function renameStage(log: RallyLog, id: string, name: string): RallyLog {
  const trimmed = name.trim();
  if (!trimmed) return log;
  return {
    stages: log.stages.map((s) => (s.id === id ? { ...s, name: trimmed } : s)),
    active: log.active?.id === id ? { ...log.active, name: trimmed } : log.active,
  };
}

// ─────────────────────────────────────────────────────────────────
// Persistence parsing
// ─────────────────────────────────────────────────────────────────

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function parseCheckpoint(v: unknown): Checkpoint | null {
  if (!v || typeof v !== 'object') return null;
  const c = v as Record<string, unknown>;
  if (!isNum(c.wallTime) || !isNum(c.elapsedSec) || !isNum(c.fusedM) || !isNum(c.rawM)) {
    return null;
  }
  return { wallTime: c.wallTime, elapsedSec: c.elapsedSec, fusedM: c.fusedM, rawM: c.rawM };
}

function parseStage(v: unknown): Stage | null {
  if (!v || typeof v !== 'object') return null;
  const s = v as Record<string, unknown>;
  if (
    typeof s.id !== 'string' ||
    typeof s.name !== 'string' ||
    !isNum(s.targetKmh) ||
    !isNum(s.startedAt) ||
    !Array.isArray(s.checkpoints)
  ) {
    return null;
  }
  const checkpoints = s.checkpoints.map(parseCheckpoint).filter((c): c is Checkpoint => !!c);
  return {
    id: s.id,
    name: s.name,
    targetKmh: s.targetKmh,
    startedAt: s.startedAt,
    checkpoints,
    ...(s.interrupted === true ? { interrupted: true } : {}),
  };
}

/**
 * Parse a stored log. A stage that was still active means the app was
 * closed mid-stage: its GPS distance can't be recovered, so it is archived
 * as interrupted.
 */
export function restoreLog(raw: unknown): RallyLog {
  if (!raw || typeof raw !== 'object') return EMPTY_LOG;
  const r = raw as Record<string, unknown>;
  const stages = Array.isArray(r.stages)
    ? r.stages.map(parseStage).filter((s): s is Stage => !!s)
    : [];
  const active = parseStage(r.active);
  return archiveActive({ stages, active }, true);
}
