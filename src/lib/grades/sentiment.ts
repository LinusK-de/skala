/**
 * Maps a native-scale average to a sentiment bucket. This is the ONLY thing that
 * colours a number (sage = good, neutral = taupe ink, warning = at-risk) — color
 * is reserved for data. Thresholds are deliberately gentle and scale-aware; they
 * are display sentiment, not an official pass/fail judgement.
 */
import type { Scale } from './types';

export type Sentiment = 'positive' | 'neutral' | 'warning';

export function sentimentFor(avg: number, scale: Scale): Sentiment {
  if (scale === 'points_0_15') {
    // 5 points = ausreichend (pass). 10+ (≈ 2,3 or better) reads as good.
    if (avg >= 10) return 'positive';
    if (avg >= 5) return 'neutral';
    return 'warning';
  }
  // 1–6: lower is better. 4,0 = ausreichend.
  if (avg <= 2.5) return 'positive';
  if (avg <= 4.0) return 'neutral';
  return 'warning';
}
