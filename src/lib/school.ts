/**
 * Pure helpers for the school-year / Halbjahr structure. A German school year
 * spans two calendar years (≈ August → July), so the label is derived from the
 * month, not just the calendar year. Term membership itself is always EXPLICIT
 * (a grade carries its termId) — this only produces display labels and defaults.
 */

/** The school-year label for a date, e.g. a date in June 2026 → "2025/26". */
export function currentSchoolYear(date: Date): string {
  const year = date.getFullYear();
  // August (month index 7) onward belongs to the year that just started.
  const startYear = date.getMonth() >= 7 ? year : year - 1;
  const endShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}/${endShort}`;
}

/** Compact term label, e.g. grade 11, half 1 → "11/1". */
export function termLabel(gradeLevel: number, half: number): string {
  return `${gradeLevel}/${half}`;
}

/** The Jahrgangsstufen of a stage, inclusive. */
export function gradeLevels(from: number, to: number): number[] {
  const levels: number[] = [];
  for (let g = from; g <= to; g++) levels.push(g);
  return levels;
}
