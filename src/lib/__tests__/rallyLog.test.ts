import { describe, expect, it } from 'vitest';
import { fmtTime } from '../format';
import {
  EMPTY_LOG,
  addCheckpoint,
  archiveActive,
  beginStage,
  buildRows,
  idealSecFor,
  paceMessage,
  paceState,
  renameStage,
  restoreLog,
  type Stage,
} from '../rallyLog';

const cp = (elapsedSec: number, fusedM: number, rawM = fusedM) => ({
  wallTime: 1_000_000 + elapsedSec * 1000,
  elapsedSec,
  fusedM,
  rawM,
});

const stageWith = (checkpoints: Stage['checkpoints'], targetKmh = 50): Stage => ({
  id: 's1',
  name: 'Tramo 1',
  targetKmh,
  startedAt: 1_000_000,
  checkpoints,
});

describe('idealSecFor', () => {
  it('is 72 s for 1 km at 50 km/h', () => {
    expect(idealSecFor(1000, 50)).toBeCloseTo(72, 6);
  });

  it('is 0 without distance or speed', () => {
    expect(idealSecFor(0, 50)).toBe(0);
    expect(idealSecFor(1000, 0)).toBe(0);
  });
});

describe('buildRows', () => {
  it('computes cumulative ideal and diff (+ = late)', () => {
    const rows = buildRows(stageWith([cp(75, 1000)]));
    expect(rows[0].n).toBe(1);
    expect(rows[0].fused.idealSec).toBeCloseTo(72, 6);
    expect(rows[0].fused.diffSec).toBeCloseTo(3, 6);
  });

  it('computes partials against the previous checkpoint', () => {
    const rows = buildRows(stageWith([cp(72, 1000), cp(140, 2000)]));
    expect(rows[1].partialSec).toBeCloseTo(68, 6);
    expect(rows[1].fused.partialDistanceM).toBeCloseTo(1000, 6);
    expect(rows[1].fused.partialIdealSec).toBeCloseTo(72, 6);
    // 1 km in 68 s ≈ 52.94 km/h
    expect(rows[1].fused.partialAvgKmh).toBeCloseTo(52.94, 2);
    // ahead: 140 − 144
    expect(rows[1].fused.diffSec).toBeCloseTo(-4, 6);
  });

  it('keeps fused and raw independent', () => {
    const rows = buildRows(stageWith([cp(72, 1000, 1100)]));
    expect(rows[0].fused.diffSec).toBeCloseTo(0, 6);
    expect(rows[0].raw.idealSec).toBeCloseTo(79.2, 6);
    expect(rows[0].raw.diffSec).toBeCloseTo(-7.2, 6);
  });
});

describe('paceState', () => {
  it('is ok inside tolerance', () => {
    expect(paceState(1.4, 1.5)).toEqual({ zone: 'ok', intensity: 0, blink: false });
    expect(paceState(-1.5, 1.5).zone).toBe('ok');
  });

  it('is ahead (negative delta) and late (positive delta) outside tolerance', () => {
    expect(paceState(-2, 1.5).zone).toBe('ahead');
    expect(paceState(2, 1.5).zone).toBe('late');
  });

  it('grows intensity from the tolerance edge to 3× tolerance', () => {
    expect(paceState(2.25, 1.5).intensity).toBeCloseTo(0.25, 6);
    expect(paceState(4.5, 1.5).intensity).toBe(1);
    expect(paceState(10, 1.5).intensity).toBe(1);
  });

  it('tells the driver to brake when ahead and speed up when late', () => {
    expect(paceMessage(paceState(-2, 1.5))).toBe('FRENÁ');
    expect(paceMessage(paceState(2, 1.5))).toBe('ACELERÁ');
    expect(paceMessage(paceState(0.5, 1.5))).toBeNull();
  });

  it('blinks only beyond 2× tolerance', () => {
    expect(paceState(3, 1.5).blink).toBe(false);
    expect(paceState(3.1, 1.5).blink).toBe(true);
    expect(paceState(-3.1, 1.5).blink).toBe(true);
  });
});

describe('log operations', () => {
  it('names stages sequentially and archives on the next start', () => {
    let log = beginStage(EMPTY_LOG, 50, 1000);
    expect(log.active?.name).toBe('Tramo 1');
    log = addCheckpoint(log, cp(10, 100));
    log = beginStage(log, 60, 2000);
    expect(log.stages).toHaveLength(1);
    expect(log.stages[0].checkpoints).toHaveLength(1);
    expect(log.active?.name).toBe('Tramo 2');
    expect(log.active?.targetKmh).toBe(60);
  });

  it('drops a stage without checkpoints when archiving', () => {
    const log = archiveActive(beginStage(EMPTY_LOG, 50, 1000));
    expect(log).toEqual(EMPTY_LOG);
  });

  it('ignores checkpoints when no stage is active', () => {
    expect(addCheckpoint(EMPTY_LOG, cp(1, 1))).toBe(EMPTY_LOG);
  });

  it('renames a stage and ignores blank names', () => {
    let log = addCheckpoint(beginStage(EMPTY_LOG, 50, 1000), cp(10, 100));
    log = archiveActive(log);
    const id = log.stages[0].id;
    expect(renameStage(log, id, '  PE3 – Los Gigantes ').stages[0].name).toBe(
      'PE3 – Los Gigantes',
    );
    expect(renameStage(log, id, '   ').stages[0].name).toBe('Tramo 1');
  });
});

describe('restoreLog', () => {
  it('archives a stage left active as interrupted', () => {
    const stored = { stages: [], active: stageWith([cp(10, 100)]) };
    const log = restoreLog(JSON.parse(JSON.stringify(stored)));
    expect(log.active).toBeNull();
    expect(log.stages).toHaveLength(1);
    expect(log.stages[0].interrupted).toBe(true);
  });

  it('returns an empty log for garbage', () => {
    expect(restoreLog(null)).toEqual(EMPTY_LOG);
    expect(restoreLog('nope')).toEqual(EMPTY_LOG);
    expect(restoreLog({ stages: [{ id: 1 }] })).toEqual(EMPTY_LOG);
  });
});

describe('fmtTime', () => {
  it('formats with hundredths', () => {
    expect(fmtTime(0)).toBe('00:00.00');
    expect(fmtTime(10.53)).toBe('00:10.53');
    expect(fmtTime(754.456)).toBe('12:34.46');
    expect(fmtTime(59.996)).toBe('01:00.00');
    expect(fmtTime(3725.3)).toBe('1:02:05.30');
  });
});
