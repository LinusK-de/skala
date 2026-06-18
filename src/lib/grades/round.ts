/**
 * Display-only helpers. These NEVER touch stored values — internal math keeps full
 * precision; we round and format only at the moment of rendering.
 */
import type { Scale } from './types';

/** Round to `decimals` places (default 1). */
export function roundForDisplay(n: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/** Format a number the German way, with a decimal comma: 2.3 → "2,3". */
export function formatDecimal(n: number, decimals = 1): string {
  return roundForDisplay(n, decimals).toFixed(decimals).replace('.', ',');
}

/** The probable whole report grade (Zeugnisnote) from a 1–6 decimal average. */
export function probableReportGrade(decimalAverage: number): number {
  return Math.round(decimalAverage);
}

/** Format an average in its native unit: "2,3" for grades, "11,3 P" for points. */
export function formatNativeAverage(avg: number, scale: Scale, decimals = 1): string {
  return scale === 'points_0_15'
    ? `${formatDecimal(avg, decimals)} P`
    : formatDecimal(avg, decimals);
}
