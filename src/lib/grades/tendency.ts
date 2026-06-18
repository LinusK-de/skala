/**
 * The 1–6 grade scale with +/- tendencies — the single most load-bearing
 * primitive in the app. Everything that averages Sek-I grades goes through here.
 *
 * German convention: a '+' makes a grade BETTER (a 2+ sits between 1 and 2), a
 * '-' makes it WORSE. Encoded as `value + tendency*0.3`, so:
 *   1+ =0.7 · 1 =1.0 · 1- =1.3 · 2+ =1.7 · 2 =2.0 · 2- =2.3 · … · 6 =6.0
 * (1+ and 6- are allowed on individual marks; whether to OFFER them is a UI
 * choice in the entry grid, not a math concern.)
 */
import type { Tendency } from './types';

/** Round to one decimal place — keeps `2 + 0.3` as a clean `2.3`, not `2.2999…`. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Convert a 1–6 grade with an optional +/- tendency to its decimal value used
 * for averaging. `null` tendency is treated as plain.
 */
export function tendencyToDecimal(value: number, tendency: Tendency | null): number {
  return round1(value + (tendency ?? 0) * 0.3);
}

/** Every canonical {decimal → label} pair, e.g. 1.7 → "2+". Built once. */
const LABEL_TABLE: { decimal: number; label: string }[] = (() => {
  const rows: { decimal: number; label: string }[] = [];
  for (let value = 1; value <= 6; value++) {
    for (const tendency of [-1, 0, 1] as Tendency[]) {
      const suffix = tendency === -1 ? '+' : tendency === 1 ? '-' : '';
      rows.push({ decimal: tendencyToDecimal(value, tendency), label: `${value}${suffix}` });
    }
  }
  return rows;
})();

/**
 * Render a decimal (a single grade OR an average) as the nearest tendency label,
 * e.g. 2.27 → "2-", 1.95 → "2". Used for compact summaries; the precise decimal
 * is shown separately where exactness matters.
 */
export function decimalToGradeLabel(decimal: number): string {
  let best = LABEL_TABLE[0];
  let bestDist = Math.abs(best.decimal - decimal);
  for (const row of LABEL_TABLE) {
    const dist = Math.abs(row.decimal - decimal);
    if (dist < bestDist) {
      best = row;
      bestDist = dist;
    }
  }
  return best.label;
}
