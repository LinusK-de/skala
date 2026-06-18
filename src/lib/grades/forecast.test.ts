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
