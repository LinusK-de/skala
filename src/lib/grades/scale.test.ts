import { isBetter, scaleSpec, toAveragingValue } from './scale';

describe('scaleSpec', () => {
  it('describes the 1–6 grade scale', () => {
    const spec = scaleSpec('grades_1_6');
    expect(spec.betterIsLower).toBe(true);
    expect(spec.best).toBe(1);
    expect(spec.worst).toBe(6);
    expect(spec.cells).toHaveLength(16);
    expect(spec.cells[0]).toEqual({ value: 1, tendency: -1, label: '1+' });
    expect(spec.cells[15]).toEqual({ value: 6, tendency: 0, label: '6' });
  });

  it('describes the 0–15 points scale', () => {
    const spec = scaleSpec('points_0_15');
    expect(spec.betterIsLower).toBe(false);
    expect(spec.best).toBe(15);
    expect(spec.worst).toBe(0);
    expect(spec.cells).toHaveLength(16);
    expect(spec.cells[0]).toEqual({ value: 15, tendency: null, label: '15' });
    expect(spec.cells[15]).toEqual({ value: 0, tendency: null, label: '0' });
  });
});

describe('toAveragingValue', () => {
  it('applies the tendency on the grade scale', () => {
    expect(toAveragingValue('grades_1_6', 2, -1)).toBeCloseTo(1.7, 5);
  });
  it('passes points through unchanged', () => {
    expect(toAveragingValue('points_0_15', 11, null)).toBe(11);
  });
});

describe('isBetter', () => {
  it('respects scale direction', () => {
    expect(isBetter('grades_1_6', 1, 2)).toBe(true);
    expect(isBetter('grades_1_6', 3, 2)).toBe(false);
    expect(isBetter('points_0_15', 12, 10)).toBe(true);
    expect(isBetter('points_0_15', 8, 10)).toBe(false);
  });
});
