import { gradeToPoints, pointsToGrade } from './points';

describe('pointsToGrade (KMK table)', () => {
  const table: [number, number][] = [
    [15, 0.7],
    [14, 1.0],
    [13, 1.3],
    [12, 1.7],
    [11, 2.0],
    [10, 2.3],
    [9, 2.7],
    [8, 3.0],
    [7, 3.3],
    [6, 3.7],
    [5, 4.0],
    [4, 4.3],
    [3, 4.7],
    [2, 5.0],
    [1, 5.3],
    [0, 6.0],
  ];

  it.each(table)('%s points → grade %s', (points, grade) => {
    expect(pointsToGrade(points)).toBeCloseTo(grade, 5);
  });

  it('5 points is exactly the pass threshold 4,0', () => {
    expect(pointsToGrade(5)).toBeCloseTo(4.0, 5);
  });

  it('interpolates fractional point averages', () => {
    // halfway between 11 (2.0) and 12 (1.7)
    expect(pointsToGrade(11.5)).toBeCloseTo(1.85, 5);
  });

  it('is monotonic: more points is never a worse grade', () => {
    for (let p = 0; p < 15; p++) {
      expect(pointsToGrade(p + 1)).toBeLessThan(pointsToGrade(p));
    }
  });

  it('clamps out-of-range input', () => {
    expect(pointsToGrade(20)).toBeCloseTo(0.7, 5);
    expect(pointsToGrade(-3)).toBeCloseTo(6.0, 5);
  });
});

describe('gradeToPoints (inverse)', () => {
  it.each([
    [1.0, 14],
    [2.0, 11],
    [4.0, 5],
    [6.0, 0],
    [0.7, 15],
  ])('grade %s → %s points', (grade, points) => {
    expect(gradeToPoints(grade)).toBeCloseTo(points, 5);
  });
});
