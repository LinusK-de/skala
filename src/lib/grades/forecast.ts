/**
 * "Was brauche ich in der nächsten Klausur, um mein Ziel zu erreichen?"
 *
 * A deliberately SIMPLE, honest model: it treats the subject as a flat weighted
 * mean of the counting grades plus one upcoming grade of `nextWeight`, then solves
 * for the mark that mark must hit. (It does not re-run the full two-level block
 * weighting — it is a motivating Richtwert, and is labelled as such in the UI.)
 *
 * Returns a discriminated result so the screen can say "du brauchst mindestens …",
 * "bereits sicher", or "nicht mehr erreichbar" — never an impossible number.
 */
import { scaleSpec, toAveragingValue } from './scale';
import type { ForecastResult, GradeInput, Scale } from './types';

export function requiredNextGrade(
  currentGrades: GradeInput[],
  target: number,
  nextWeight: number,
  scale: Scale,
): ForecastResult {
  if (!(nextWeight > 0)) return { kind: 'empty' };

  let weightedSum = 0;
  let totalWeight = 0;
  for (const grade of currentGrades) {
    if (!grade.countsTowardAverage || !(grade.weight > 0)) continue;
    weightedSum += toAveragingValue(scale, grade.value, grade.tendency) * grade.weight;
    totalWeight += grade.weight;
  }

  // The mark x that makes the new weighted average exactly equal the target.
  const required = (target * (totalWeight + nextWeight) - weightedSum) / nextWeight;
  const spec = scaleSpec(scale);

  // Compare against the best/worst mark a student can ACTUALLY score, not the
  // integer endpoints: on the grade scale a 1+ averages as 0.7, so a target
  // needing a 1+ is reachable, not "impossible".
  const bestAttainable = toAveragingValue(scale, spec.best, spec.betterIsLower ? -1 : null);
  const worstAttainable = toAveragingValue(scale, spec.worst, null);

  if (spec.betterIsLower) {
    // Lower is better: the next mark must be `required` or better (smaller).
    if (required >= worstAttainable) return { kind: 'secure' };
    if (required < bestAttainable) return { kind: 'impossible' };
  } else {
    // Higher is better: the next mark must be `required` or more points.
    if (required <= worstAttainable) return { kind: 'secure' };
    if (required > bestAttainable) return { kind: 'impossible' };
  }
  return { kind: 'reachable', required };
}
