/**
 * Shared types for the grade-math layer. These describe the small plain DTOs the
 * pure `lib/grades` functions operate on — NOT the Drizzle rows. The db/ and
 * hooks/ layers map rows into these shapes so `lib/` stays free of any DB import
 * (architecture hard-rule #3).
 */

/** Which grading scale a stage uses. The scale lives on the stage, never per grade. */
export type Scale = 'grades_1_6' | 'points_0_15';

/**
 * A +/- tendency on a 1–6 grade. The German convention: '+' is BETTER (a 2+ is
 * closer to a 1), '-' is WORSE. Encoded so the decimal is simply `value + tendency*0.3`.
 *  -1 → '+'   ·   0 → plain   ·   +1 → '-'
 * Always `null` on the 0–15 points scale.
 */
export type Tendency = -1 | 0 | 1;

/**
 * The block a category aggregates into. German report cards combine a
 * "schriftlich" block and a "mündlich / sonstige" block by a per-subject ratio.
 * `other` (Projekt, Referat, GFS …) counts inside the mündlich/sonstige block.
 */
export type CategoryType = 'written' | 'oral' | 'other';

/** A grade as the math layer sees it (mapped from a `grades` row). */
export interface GradeInput {
  /** 1..6 on the grade scale, 0..15 on the points scale. */
  value: number;
  /** +/- tendency on the 1–6 scale; `null` for points or a plain grade. */
  tendency: Tendency | null;
  /** Per-grade weight on top of the category weight (default 1). */
  weight: number;
  /** Which category this grade belongs to; `null` if its category was removed. */
  categoryId: number | null;
  /** A grade the student logged but excluded from the average. */
  countsTowardAverage: boolean;
}

/** A grade category as the math layer sees it (mapped from a `grade_categories` row). */
export interface CategoryInput {
  id: number;
  /** Drives which block (schriftlich vs mündlich/sonstige) the category averages into. */
  type: CategoryType;
  /** Weight of this category within its block (default 1). */
  weight: number;
}

/** Per-category sub-average, surfaced in the UI ("Klassenarbeiten Ø 2,3"). */
export interface CategoryAverage {
  categoryId: number | null;
  avg: number;
  count: number;
}

/** The two aggregation blocks, present only when they hold grades. */
export interface BlockAverages {
  written?: number;
  oral?: number;
}

/**
 * Result of every averaging function. The `empty` arm forces the UI to render
 * "Kein Schnitt"/"—" instead of `NaN` or a misleading `0,0`.
 */
export type MeanResult = { kind: 'empty' } | { kind: 'value'; avg: number };

/** A subject average carries its block + category breakdown for the detail screen. */
export type SubjectAverageResult =
  | { kind: 'empty' }
  | {
      kind: 'value';
      /** In the native unit: a 1.0–6.0 decimal for grades, raw points for points. */
      avg: number;
      blocks: BlockAverages;
      categories: CategoryAverage[];
    };

/**
 * Result of the "what do I need next?" solver.
 *  - `reachable`  → the worst grade (or fewest points) the next mark may be while
 *                   still hitting the target. `required` is in the native unit.
 *  - `secure`     → the target holds no matter how the next grade turns out.
 *  - `impossible` → even a perfect next grade can't reach the target.
 *  - `empty`      → no target set or no grades to compute from yet.
 */
export type ForecastResult =
  | { kind: 'empty' }
  | { kind: 'secure' }
  | { kind: 'impossible' }
  | { kind: 'reachable'; required: number };

/** One tappable cell in the grade-entry grid. */
export interface GradeCell {
  value: number;
  tendency: Tendency | null;
  label: string;
}
