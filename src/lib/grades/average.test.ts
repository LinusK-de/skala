import {
  meanOf,
  stageAverage,
  subjectAverage,
  termAverage,
  weightedAverage,
  yearAverage,
} from './average';
import type { CategoryInput, GradeInput, Tendency } from './types';

function grade(
  value: number,
  categoryId: number,
  opts: { tendency?: Tendency | null; weight?: number; counts?: boolean } = {},
): GradeInput {
  return {
    value,
    tendency: opts.tendency ?? null,
    weight: opts.weight ?? 1,
    categoryId,
    countsTowardAverage: opts.counts ?? true,
  };
}

const WRITTEN: CategoryInput = { id: 1, type: 'written', weight: 1 };
const ORAL: CategoryInput = { id: 2, type: 'oral', weight: 1 };

describe('weightedAverage', () => {
  it('returns empty with no usable items', () => {
    expect(weightedAverage([])).toEqual({ kind: 'empty' });
    expect(weightedAverage([{ value: 2, weight: 0 }])).toEqual({ kind: 'empty' });
  });
  it('computes a weighted mean', () => {
    const r = weightedAverage([
      { value: 1, weight: 2 },
      { value: 4, weight: 1 },
    ]);
    expect(r).toEqual({ kind: 'value', avg: 2 });
  });
});

describe('subjectAverage — two-level weighting', () => {
  it('does not let six small oral marks drown two Klausuren', () => {
    const grades = [
      grade(1, 1), grade(1, 1), // two Klausuren = 1.0
      grade(3, 2), grade(3, 2), grade(3, 2), grade(3, 2), grade(3, 2), grade(3, 2), // six mündlich = 3.0
    ];
    const r = subjectAverage(grades, [WRITTEN, ORAL], 1, 1, 'grades_1_6');
    expect(r.kind).toBe('value');
    if (r.kind !== 'value') return;
    expect(r.avg).toBeCloseTo(2.0, 5); // not 2.5, which a flat pool would give
    expect(r.blocks.written).toBeCloseTo(1.0, 5);
    expect(r.blocks.oral).toBeCloseTo(3.0, 5);
    expect(r.categories).toHaveLength(2);
  });

  it('applies the schriftlich-heavy core ratio (2:1)', () => {
    const grades = [grade(1, 1), grade(3, 2)];
    const r = subjectAverage(grades, [WRITTEN, ORAL], 2, 1, 'grades_1_6');
    if (r.kind !== 'value') throw new Error('expected value');
    expect(r.avg).toBeCloseTo((1 * 2 + 3 * 1) / 3, 5); // 1.6667
  });

  it('ignores grades flagged as not counting', () => {
    const grades = [grade(2, 1), grade(6, 1, { counts: false })];
    const r = subjectAverage(grades, [WRITTEN], 1, 1, 'grades_1_6');
    if (r.kind !== 'value') throw new Error('expected value');
    expect(r.avg).toBeCloseTo(2.0, 5);
  });

  it('uses only the present block when the other is empty', () => {
    const grades = [grade(2, 1), grade(2, 1)];
    const r = subjectAverage(grades, [WRITTEN, ORAL], 1, 5, 'grades_1_6');
    if (r.kind !== 'value') throw new Error('expected value');
    expect(r.avg).toBeCloseTo(2.0, 5);
    expect(r.blocks.oral).toBeUndefined();
  });

  it('averages the points scale in points', () => {
    const grades = [grade(13, 1), grade(11, 2)];
    const r = subjectAverage(grades, [WRITTEN, ORAL], 1, 1, 'points_0_15');
    if (r.kind !== 'value') throw new Error('expected value');
    expect(r.avg).toBeCloseTo(12, 5);
  });

  it('is empty with no counting grades', () => {
    expect(subjectAverage([], [WRITTEN], 1, 1, 'grades_1_6')).toEqual({ kind: 'empty' });
    expect(
      subjectAverage([grade(2, 1, { counts: false })], [WRITTEN], 1, 1, 'grades_1_6'),
    ).toEqual({ kind: 'empty' });
  });
});

describe('term / year / stage means', () => {
  it('means subject averages for a term', () => {
    expect(termAverage([2.0, 3.0])).toEqual({ kind: 'value', avg: 2.5 });
  });
  it('means the two Halbjahre for a year', () => {
    expect(yearAverage([2.0, 3.0])).toEqual({ kind: 'value', avg: 2.5 });
  });
  it('means term averages for a stage', () => {
    expect(stageAverage([2, 3, 4])).toEqual({ kind: 'value', avg: 3 });
  });
  it('is empty with nothing to average', () => {
    expect(meanOf([])).toEqual({ kind: 'empty' });
  });
});
