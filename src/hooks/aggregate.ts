/**
 * Pure aggregation glue: turns db rows into the lib DTOs and runs the grade math.
 * Not hooks — plain functions the hooks call inside useMemo. Lives in the hooks
 * layer because it bridges db/ and lib/ (lib itself must stay DB-free).
 */
import {
  normalizeAverageToDecimal,
  subjectAverage,
  termAverage,
  type CategoryType,
  type MeanResult,
  type Scale,
  type SubjectAverageResult,
} from '@/lib/grades';

import {
  toGradeInput,
  type Grade,
  type GradeCategory,
  type Stage,
  type Subject,
  type Term,
} from '@/db';

export interface SubjectWithAverage {
  subject: Subject;
  average: SubjectAverageResult;
}

/** The weighted average of one subject from its rows, in the stage's native scale. */
export function subjectAverageFor(
  subject: Subject,
  categories: GradeCategory[],
  grades: Grade[],
  scale: Scale,
): SubjectAverageResult {
  const categoryInputs = categories.map((c) => ({
    id: c.id,
    type: c.type as CategoryType,
    weight: c.weight,
  }));
  return subjectAverage(
    grades.map(toGradeInput),
    categoryInputs,
    subject.writtenWeight,
    subject.oralWeight,
    scale,
  );
}

/** Every subject of a term with its average, plus the overall term average. */
export function termOverview(
  subjects: Subject[],
  allCategories: GradeCategory[],
  termGrades: Grade[],
  scale: Scale,
): { items: SubjectWithAverage[]; average: MeanResult } {
  const items = subjects.map((subject) => {
    const categories = allCategories.filter((c) => c.subjectId === subject.id);
    const grades = termGrades.filter((g) => g.subjectId === subject.id);
    return { subject, average: subjectAverageFor(subject, categories, grades, scale) };
  });
  const values: number[] = [];
  for (const item of items) {
    if (item.average.kind === 'value') values.push(item.average.avg);
  }
  return { items, average: termAverage(values) };
}

export interface TrendPoint {
  termId: number;
  label: string;
  stageId: number;
  stageName: string;
  scale: Scale;
  /** Overall term average in the native scale, or null if the term has no grades. */
  native: number | null;
  /** The same value on the unified 1.0–6.0 axis for the cross-stage line. */
  normalized: number | null;
  /** True on the first term of a new stage (draws a boundary divider). */
  isStageBoundary: boolean;
}

/** One overall-average point per term, ordered, with stage boundaries flagged. */
export function careerTrend(
  stages: Stage[],
  terms: Term[],
  subjects: Subject[],
  categories: GradeCategory[],
  grades: Grade[],
): TrendPoint[] {
  const stageById = new Map(stages.map((s) => [s.id, s]));
  let previousStageId: number | null = null;

  return terms.map((term) => {
    const stage = stageById.get(term.stageId);
    const scale = (stage?.scale ?? 'grades_1_6') as Scale;
    const stageSubjects = subjects.filter((s) => s.stageId === term.stageId);
    const termGrades = grades.filter((g) => g.termId === term.id);
    const { average } = termOverview(stageSubjects, categories, termGrades, scale);
    const native = average.kind === 'value' ? average.avg : null;
    const normalized = native === null ? null : normalizeAverageToDecimal(native, scale);
    const isStageBoundary = term.stageId !== previousStageId;
    previousStageId = term.stageId;
    return {
      termId: term.id,
      label: term.label,
      stageId: term.stageId,
      stageName: stage?.name ?? '',
      scale,
      native,
      normalized,
      isStageBoundary,
    };
  });
}
