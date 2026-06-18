/** Bucket raw grade values into a histogram, scale-aware. Pure. */
import type { Scale } from './types';

export interface DistributionBucket {
  label: string;
  count: number;
}

export function gradeDistribution(values: number[], scale: Scale): DistributionBucket[] {
  if (scale === 'points_0_15') {
    const ranges = [
      { label: '0–4', lo: 0, hi: 4 },
      { label: '5–7', lo: 5, hi: 7 },
      { label: '8–10', lo: 8, hi: 10 },
      { label: '11–12', lo: 11, hi: 12 },
      { label: '13–15', lo: 13, hi: 15 },
    ];
    return ranges.map((r) => ({
      label: r.label,
      count: values.filter((v) => v >= r.lo && v <= r.hi).length,
    }));
  }
  return [1, 2, 3, 4, 5, 6].map((n) => ({
    label: `${n}`,
    count: values.filter((v) => Math.round(v) === n).length,
  }));
}
