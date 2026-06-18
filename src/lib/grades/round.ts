/**
 * Display-only helpers. These NEVER touch stored values — internal math keeps full
 * precision; we round and format only at the moment of rendering.
 */

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
