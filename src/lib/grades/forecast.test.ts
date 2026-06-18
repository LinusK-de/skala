import { requiredNextGrade } from './forecast';
import type { GradeInput } from './types';

function flat(values: number[], scale: 'grades_1_6' | 'points_0_15'): GradeInput[] {
  return values.map((value) => ({
    value,
    tendency: null,
    weight: 1,
    categoryId: 1,
    countsTowardAverage: true,
  }));
}

describe('requiredNextGrade — grade scale (lower is better)', () => {
  it('returns the worst mark that still hits the target', () => {
    const r = requiredNextGrade(flat([2, 2], 'grades_1_6'), 2.0, 1, 'grades_1_6');
    expect(r).toEqual({ kind: 'reachable', required: 2.0 });
  });

  it('reports the target as already secure', () => {
    const r = requiredNextGrade(flat([2, 2], 'grades_1_6'), 3.5, 1, 'grades_1_6');
    expect(r).toEqual({ kind: 'secure' });
  });

  it('reports an unreachable target', () => {
    const r = requiredNextGrade(flat([5, 5], 'grades_1_6'), 1.0, 1, 'grades_1_6');
    expect(r).toEqual({ kind: 'impossible' });
  });

  it('is empty without a usable next weight', () => {
    expect(requiredNextGrade(flat([2, 2], 'grades_1_6'), 2.0, 0, 'grades_1_6')).toEqual({
      kind: 'empty',
    });
  });
});

describe('requiredNextGrade — top-mark (1+) and tendency edge cases', () => {
  it('treats a required 1+ (0.7) as reachable, not impossible', () => {
    // [2,2], target 1.6, next weight 1 → required = (1.6*3 - 4)/1 = 0.8 (between 1+ and 1)
    const r = requiredNextGrade(flat([2, 2], 'grades_1_6'), 1.6, 1, 'grades_1_6');
    expect(r.kind).toBe('reachable');
    if (r.kind === 'reachable') expect(r.required).toBeCloseTo(0.8, 5);
  });

  it('is impossible only when the required mark is better than a 1+', () => {
    // [2,2], target 1.5 → required = 0.5 < 0.7 → truly impossible
    expect(requiredNextGrade(flat([2, 2], 'grades_1_6'), 1.5, 1, 'grades_1_6')).toEqual({
      kind: 'impossible',
    });
  });

  it('accounts for a tendency-bearing current grade', () => {
    const grades = [
      { value: 2, tendency: -1 as const, weight: 1, categoryId: 1, countsTowardAverage: true }, // 1.7
      { value: 2, tendency: null, weight: 1, categoryId: 1, countsTowardAverage: true }, // 2.0
    ];
    // weightedSum = 3.7, W = 2, target 2.0 → required = (2.0*3 - 3.7)/1 = 2.3
    const r = requiredNextGrade(grades, 2.0, 1, 'grades_1_6');
    expect(r.kind).toBe('reachable');
    if (r.kind === 'reachable') expect(r.required).toBeCloseTo(2.3, 5);
  });
});

describe('requiredNextGrade — points scale (higher is better)', () => {
  it('returns the minimum points needed', () => {
    const r = requiredNextGrade(flat([10, 10], 'points_0_15'), 11, 1, 'points_0_15');
    expect(r).toEqual({ kind: 'reachable', required: 13 });
  });

  it('reports the target as already secure', () => {
    const r = requiredNextGrade(flat([10, 10], 'points_0_15'), 6, 1, 'points_0_15');
    expect(r).toEqual({ kind: 'secure' });
  });

  it('reports an unreachable target', () => {
    const r = requiredNextGrade(flat([10, 10], 'points_0_15'), 15, 1, 'points_0_15');
    expect(r).toEqual({ kind: 'impossible' });
  });
});
