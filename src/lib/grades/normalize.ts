/**
 * Cross-stage normalization to ONE unified 1.0–6.0 axis — used solely for the
 * career trend line that stitches a 1–6 stage and a 0–15 stage into a single
 * picture. It is always presented as an approximation ("Schätzung"); native
 * screens keep their own units.
 */
import { pointsToGrade } from './points';
import { tendencyToDecimal } from './tendency';
import type { Scale, Tendency } from './types';

/** One grade's value on the unified 1.0–6.0 axis. */
export function normalizeToDecimal(
  value: number,
  tendency: Tendency | null,
  scale: Scale,
): number {
  return scale === 'points_0_15' ? pointsToGrade(value) : tendencyToDecimal(value, tendency);
}

/** An average (in its native unit) on the unified 1.0–6.0 axis. */
export function normalizeAverageToDecimal(avg: number, scale: Scale): number {
  return scale === 'points_0_15' ? pointsToGrade(avg) : avg;
}
