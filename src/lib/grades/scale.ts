/**
 * A single descriptor per scale so the rest of the app branches on DATA, not on
 * scattered `if (scale === …)` chains. The entry grid, the chart axes and the
 * forecast all read from here.
 */
import { tendencyToDecimal } from './tendency';
import type { GradeCell, Scale, Tendency } from './types';

export interface ScaleSpec {
  scale: Scale;
  /** 1–6: a smaller number is better. 0–15: a larger number is better. */
  betterIsLower: boolean;
  /** Native value of the best possible mark (1 for grades, 15 for points). */
  best: number;
  /** Native value of the worst possible mark (6 for grades, 0 for points). */
  worst: number;
  /** Short human label of the scale, e.g. "Noten 1–6". */
  label: string;
  /** The tappable cells for the entry grid, best mark first. */
  cells: GradeCell[];
}

/** Grade grid: 1+,1,1-,2+,…,5-,6 (16 cells — 1+ included, 6- omitted). */
function gradeCells(): GradeCell[] {
  const cells: GradeCell[] = [];
  for (let value = 1; value <= 5; value++) {
    for (const tendency of [-1, 0, 1] as Tendency[]) {
      const suffix = tendency === -1 ? '+' : '-';
      cells.push({
        value,
        tendency,
        label: tendency === 0 ? `${value}` : `${value}${suffix}`,
      });
    }
  }
  cells.push({ value: 6, tendency: 0, label: '6' });
  return cells;
}

/** Points grid: 15,14,…,0 (16 cells, best first). */
function pointCells(): GradeCell[] {
  const cells: GradeCell[] = [];
  for (let value = 15; value >= 0; value--) {
    cells.push({ value, tendency: null, label: `${value}` });
  }
  return cells;
}

const GRADE_SPEC: ScaleSpec = {
  scale: 'grades_1_6',
  betterIsLower: true,
  best: 1,
  worst: 6,
  label: 'Noten 1–6',
  cells: gradeCells(),
};

const POINTS_SPEC: ScaleSpec = {
  scale: 'points_0_15',
  betterIsLower: false,
  best: 15,
  worst: 0,
  label: 'Punkte 0–15',
  cells: pointCells(),
};

export function scaleSpec(scale: Scale): ScaleSpec {
  return scale === 'points_0_15' ? POINTS_SPEC : GRADE_SPEC;
}

/**
 * The value a single grade contributes to a native-scale average:
 *  - grades → the 1.0–6.0 decimal (tendency applied)
 *  - points → the raw points
 */
export function toAveragingValue(scale: Scale, value: number, tendency: Tendency | null): number {
  return scale === 'points_0_15' ? value : tendencyToDecimal(value, tendency);
}

/** True when `a` is a better mark than `b` on the given scale. */
export function isBetter(scale: Scale, a: number, b: number): boolean {
  return scaleSpec(scale).betterIsLower ? a < b : a > b;
}
