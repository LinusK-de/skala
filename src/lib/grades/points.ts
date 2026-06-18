/**
 * The 0–15 points scale of the gymnasiale Oberstufe and its relationship to the
 * 1–6 grade scale. Points are averaged in points (that is how Oberstufe marks
 * actually work); the conversion below is used ONLY for cross-stage display —
 * the single normalized career trend line — never to silently merge scales.
 *
 * Encoded as the explicit KMK step table (NOT a linear formula): 15 is the best
 * (1+ ≈ 0.7), 5 is the pass threshold (4,0 = ausreichend), 0 is the worst (6,0).
 */

/** Index = points (0..15) → grade decimal. The canonical lookup. */
const POINTS_TO_GRADE: readonly number[] = [
  6.0, // 0
  5.3, // 1
  5.0, // 2
  4.7, // 3
  4.3, // 4
  4.0, // 5  ← ausreichend / pass threshold
  3.7, // 6
  3.3, // 7
  3.0, // 8
  2.7, // 9
  2.3, // 10
  2.0, // 11
  1.7, // 12
  1.3, // 13
  1.0, // 14
  0.7, // 15 ← 1+
];

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Convert points to the equivalent 1–6 grade decimal. Whole points hit the KMK
 * table exactly; fractional points (e.g. an average of 11.3) interpolate linearly
 * between the two neighbouring table entries so the normalized trend line is smooth.
 */
export function pointsToGrade(points: number): number {
  const p = clamp(points, 0, 15);
  const lo = Math.floor(p);
  const hi = Math.ceil(p);
  if (lo === hi) return POINTS_TO_GRADE[lo];
  const frac = p - lo;
  return POINTS_TO_GRADE[lo] + frac * (POINTS_TO_GRADE[hi] - POINTS_TO_GRADE[lo]);
}

/**
 * Inverse: a 1–6 grade decimal to the equivalent points. Used when a unified axis
 * needs to read in points. Interpolates across the (monotonically decreasing) table.
 */
export function gradeToPoints(grade: number): number {
  const g = clamp(grade, POINTS_TO_GRADE[15], POINTS_TO_GRADE[0]); // [0.7, 6.0]
  // grade decreases as points increase; walk adjacent point pairs.
  for (let p = 0; p < 15; p++) {
    const hiGrade = POINTS_TO_GRADE[p]; // worse grade, fewer points
    const loGrade = POINTS_TO_GRADE[p + 1]; // better grade, more points
    if (g <= hiGrade && g >= loGrade) {
      const span = hiGrade - loGrade;
      const frac = span === 0 ? 0 : (hiGrade - g) / span;
      return p + frac;
    }
  }
  return 15;
}
