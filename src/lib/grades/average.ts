/**
 * Weighted averages — the core value of the app. Every function here is pure and
 * returns a discriminated result so the UI can never render `NaN` or a fake `0,0`.
 *
 * The subject average is a TWO-LEVEL weighted mean, which is how German report
 * cards actually work (not a flat pool):
 *   1. within a category, average its grades by per-grade weight       → category Ø
 *   2. within a block (schriftlich / mündlich+sonstige), combine the
 *      category averages by category weight                            → block Ø
 *   3. combine the blocks by the subject's writtenWeight : oralWeight  → subject Ø
 * This stops six small tests from drowning out two Klausuren.
 *
 * `other` categories (Projekt, Referat, GFS …) count inside the mündlich/sonstige
 * block by default; their relative pull is tuned via the category weight.
 */
import { toAveragingValue } from './scale';
import type {
  BlockAverages,
  CategoryAverage,
  CategoryInput,
  GradeInput,
  MeanResult,
  Scale,
  SubjectAverageResult,
} from './types';

interface WeightedItem {
  value: number;
  weight: number;
}

/** Σ(v·w) / Σ(w). Items with non-positive weight are ignored; empty → `empty`. */
export function weightedAverage(items: WeightedItem[]): MeanResult {
  let sum = 0;
  let totalWeight = 0;
  for (const item of items) {
    if (item.weight > 0) {
      sum += item.value * item.weight;
      totalWeight += item.weight;
    }
  }
  if (totalWeight <= 0) return { kind: 'empty' };
  return { kind: 'value', avg: sum / totalWeight };
}

/** Unweighted mean of already-computed averages (all in the same native unit). */
export function meanOf(values: number[]): MeanResult {
  return weightedAverage(values.map((value) => ({ value, weight: 1 })));
}

type Block = 'written' | 'oral';

function blockOf(type: CategoryInput['type']): Block {
  return type === 'written' ? 'written' : 'oral';
}

/**
 * The full subject average with its block and per-category breakdown.
 * `avg` is in the native unit: a 1.0–6.0 decimal for grades, raw points for points.
 */
export function subjectAverage(
  grades: GradeInput[],
  categories: CategoryInput[],
  writtenWeight: number,
  oralWeight: number,
  scale: Scale,
): SubjectAverageResult {
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  // Level 1: per-category averages over the counting grades.
  const gradesByCategory = new Map<number | null, GradeInput[]>();
  for (const grade of grades) {
    if (!grade.countsTowardAverage) continue;
    const list = gradesByCategory.get(grade.categoryId);
    if (list) list.push(grade);
    else gradesByCategory.set(grade.categoryId, [grade]);
  }

  const categoryAverages: CategoryAverage[] = [];
  const blockItems: Record<Block, WeightedItem[]> = { written: [], oral: [] };

  for (const [categoryId, categoryGrades] of gradesByCategory) {
    const result = weightedAverage(
      categoryGrades.map((g) => ({
        value: toAveragingValue(scale, g.value, g.tendency),
        weight: g.weight,
      })),
    );
    if (result.kind === 'empty') continue;

    categoryAverages.push({ categoryId, avg: result.avg, count: categoryGrades.length });

    const category = categoryId === null ? undefined : categoryById.get(categoryId);
    const block = category ? blockOf(category.type) : 'oral';
    const categoryWeight = category ? category.weight : 1;
    blockItems[block].push({ value: result.avg, weight: categoryWeight });
  }

  if (categoryAverages.length === 0) return { kind: 'empty' };

  // Level 2: block averages.
  const blocks: BlockAverages = {};
  const writtenBlock = weightedAverage(blockItems.written);
  const oralBlock = weightedAverage(blockItems.oral);
  if (writtenBlock.kind === 'value') blocks.written = writtenBlock.avg;
  if (oralBlock.kind === 'value') blocks.oral = oralBlock.avg;

  // Level 3: combine the present blocks by the subject's ratio. Guard the
  // degenerate "both weights zero" case so a value still comes out.
  const safeWritten = writtenWeight > 0 || oralWeight > 0 ? writtenWeight : 1;
  const safeOral = writtenWeight > 0 || oralWeight > 0 ? oralWeight : 1;
  const subjectItems: WeightedItem[] = [];
  if (blocks.written !== undefined)
    subjectItems.push({ value: blocks.written, weight: safeWritten });
  if (blocks.oral !== undefined) subjectItems.push({ value: blocks.oral, weight: safeOral });

  let combined = weightedAverage(subjectItems);
  // If the only present block has weight 0, fall back to that block directly.
  if (combined.kind === 'empty') {
    combined = meanOf(Object.values(blocks));
  }
  if (combined.kind === 'empty') return { kind: 'empty' };

  return { kind: 'value', avg: combined.avg, blocks, categories: categoryAverages };
}

/** Mean of a Halbjahr's subject averages (each subject counts equally). */
export function termAverage(subjectAverages: number[]): MeanResult {
  return meanOf(subjectAverages);
}

/** Mean of the (one or two) Halbjahr averages of a school year — NOT a re-pool of all grades. */
export function yearAverage(halfYearAverages: number[]): MeanResult {
  return meanOf(halfYearAverages);
}

/** Mean across a stage's term averages, in the stage's native scale. */
export function stageAverage(termAverages: number[]): MeanResult {
  return meanOf(termAverages);
}
