/**
 * Reactive hooks for grades: a term's subject overview, and a single subject's
 * detail (term + overall average, category breakdown, and the target forecast).
 */
import { useMemo } from 'react';

import {
  allCategoriesQuery,
  categoriesQuery,
  gradesForSubjectQuery,
  gradesForTermQuery,
  subjectQuery,
  subjectsQuery,
  termsForStageQuery,
  toGradeInput,
  useLiveQuery,
  type Grade,
  type GradeCategory,
  type Subject,
} from '@/db';
import {
  requiredNextGrade,
  type ForecastResult,
  type MeanResult,
  type Scale,
  type SubjectAverageResult,
  type Tendency,
} from '@/lib/grades';

import { subjectAverageFor, termOverview, type SubjectWithAverage } from './aggregate';

export interface SubjectTrendPoint {
  label: string;
  value: number | null;
}

const EMPTY: SubjectAverageResult = { kind: 'empty' };

/** All subjects of a term with their averages + the overall term average. */
export function useTermOverview(
  stageId: number | null,
  termId: number | null,
  scale: Scale,
): { items: SubjectWithAverage[]; average: MeanResult } {
  const subjects = useLiveQuery(subjectsQuery(stageId ?? -1), [stageId]);
  const grades = useLiveQuery(gradesForTermQuery(termId ?? -1), [termId]);
  const categories = useLiveQuery(allCategoriesQuery());
  return useMemo(
    () => termOverview(subjects.data ?? [], categories.data ?? [], grades.data ?? [], scale),
    [subjects.data, categories.data, grades.data, scale],
  );
}

export interface SubjectDetail {
  subject: Subject | null;
  categories: GradeCategory[];
  allGrades: Grade[];
  termGrades: Grade[];
  termAverage: SubjectAverageResult;
  overallAverage: SubjectAverageResult;
  forecast: ForecastResult | null;
}

/** One subject's full detail for the selected term (and overall). */
export function useSubjectDetail(
  subjectId: number,
  termId: number | null,
  scale: Scale,
): SubjectDetail {
  const subjectRes = useLiveQuery(subjectQuery(subjectId), [subjectId]);
  const categoriesRes = useLiveQuery(categoriesQuery(subjectId), [subjectId]);
  const gradesRes = useLiveQuery(gradesForSubjectQuery(subjectId), [subjectId]);

  return useMemo(() => {
    const subject = subjectRes.data?.[0] ?? null;
    const categories = categoriesRes.data ?? [];
    const allGrades = gradesRes.data ?? [];
    const termGrades = termId === null ? allGrades : allGrades.filter((g) => g.termId === termId);

    const termAverage = subject ? subjectAverageFor(subject, categories, termGrades, scale) : EMPTY;
    const overallAverage = subject
      ? subjectAverageFor(subject, categories, allGrades, scale)
      : EMPTY;

    let forecast: ForecastResult | null = null;
    if (subject && subject.targetGrade !== null) {
      forecast = requiredNextGrade(termGrades.map(toGradeInput), subject.targetGrade, 1, scale);
    }

    return { subject, categories, allGrades, termGrades, termAverage, overallAverage, forecast };
  }, [subjectRes.data, categoriesRes.data, gradesRes.data, termId, scale]);
}

/** This subject's average per term across its stage — for the per-subject trend line. */
export function useSubjectTrend(
  subjectId: number,
  stageId: number | null,
  scale: Scale,
): SubjectTrendPoint[] {
  const subjectRes = useLiveQuery(subjectQuery(subjectId), [subjectId]);
  const categoriesRes = useLiveQuery(categoriesQuery(subjectId), [subjectId]);
  const gradesRes = useLiveQuery(gradesForSubjectQuery(subjectId), [subjectId]);
  const termsRes = useLiveQuery(termsForStageQuery(stageId ?? -1), [stageId]);

  return useMemo(() => {
    const subject = subjectRes.data?.[0];
    if (!subject) return [];
    const categories = categoriesRes.data ?? [];
    const allGrades = gradesRes.data ?? [];
    return (termsRes.data ?? []).map((t) => {
      const termGrades = allGrades.filter((g) => g.termId === t.id);
      const avg = subjectAverageFor(subject, categories, termGrades, scale);
      return { label: t.label, value: avg.kind === 'value' ? avg.avg : null };
    });
  }, [subjectRes.data, categoriesRes.data, gradesRes.data, termsRes.data, scale]);
}

export interface RecentGrade {
  id: number;
  subjectId: number;
  subjectName: string;
  value: number;
  tendency: Tendency | null;
  date: number;
}

/** The most recently dated grades of a term, with their subject name. */
export function useRecentGrades(
  stageId: number | null,
  termId: number | null,
  limit = 3,
): RecentGrade[] {
  const grades = useLiveQuery(gradesForTermQuery(termId ?? -1), [termId]);
  const subjects = useLiveQuery(subjectsQuery(stageId ?? -1), [stageId]);
  return useMemo(() => {
    const nameById = new Map((subjects.data ?? []).map((s) => [s.id, s.name]));
    return (grades.data ?? []).slice(0, limit).map((g) => ({
      id: g.id,
      subjectId: g.subjectId,
      subjectName: nameById.get(g.subjectId) ?? '—',
      value: g.value,
      tendency: (g.tendency ?? null) as Tendency | null,
      date: g.date.getTime(),
    }));
  }, [grades.data, subjects.data, limit]);
}
