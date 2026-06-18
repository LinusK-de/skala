import { decimalToGradeLabel, tendencyToDecimal } from './tendency';

describe('tendencyToDecimal', () => {
  // The full canonical mapping — the single most important table in the app.
  const cases: [number, -1 | 0 | 1, number][] = [
    [1, -1, 0.7],
    [1, 0, 1.0],
    [1, 1, 1.3],
    [2, -1, 1.7],
    [2, 0, 2.0],
    [2, 1, 2.3],
    [3, -1, 2.7],
    [3, 0, 3.0],
    [3, 1, 3.3],
    [4, -1, 3.7],
    [4, 0, 4.0],
    [4, 1, 4.3],
    [5, -1, 4.7],
    [5, 0, 5.0],
    [5, 1, 5.3],
    [6, 0, 6.0],
  ];

  it.each(cases)('grade %s tendency %s → %s', (value, tendency, expected) => {
    expect(tendencyToDecimal(value, tendency)).toBeCloseTo(expected, 5);
  });

  it('treats a null tendency as plain', () => {
    expect(tendencyToDecimal(3, null)).toBeCloseTo(3.0, 5);
  });
});

describe('decimalToGradeLabel', () => {
  it('labels exact cells', () => {
    expect(decimalToGradeLabel(0.7)).toBe('1+');
    expect(decimalToGradeLabel(1.0)).toBe('1');
    expect(decimalToGradeLabel(1.7)).toBe('2+');
    expect(decimalToGradeLabel(2.3)).toBe('2-');
    expect(decimalToGradeLabel(6.0)).toBe('6');
  });

  it('snaps an average to the nearest tendency label', () => {
    expect(decimalToGradeLabel(1.95)).toBe('2');
    expect(decimalToGradeLabel(2.27)).toBe('2-');
  });
});
