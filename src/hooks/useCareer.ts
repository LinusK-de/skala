/**
 * Reactive hooks for the career structure (stages & terms) and the cross-stage
 * trend. Each wraps a db live query; aggregation runs in pure helpers.
 */
import { useMemo } from 'react';

import {
  allCategoriesQuery,
  allGradesQuery,
  allSubjectsQuery,
  allTermsQuery,
  currentTermQuery,
  stagesQuery,
  termsForStageQuery,
  useLiveQuery,
  type Stage,
  type Term,
} from '@/db';

import { careerTrend, type TrendPoint } from './aggregate';

/** The current term and its stage (the default context across the app). */
export function useCurrentContext(): { stage: Stage | null; term: Term | null } {
  const termRes = useLiveQuery(currentTermQuery());
  const stagesRes = useLiveQuery(stagesQuery());
  const term = termRes.data?.[0] ?? null;
  const stages = stagesRes.data ?? [];
  const stage = term ? (stages.find((s) => s.id === term.stageId) ?? null) : null;
  return { stage, term };
}

export function useStages(): Stage[] {
  return useLiveQuery(stagesQuery()).data ?? [];
}

export function useStageTerms(stageId: number | null): Term[] {
  return useLiveQuery(termsForStageQuery(stageId ?? -1), [stageId]).data ?? [];
}

/** One overall-average point per term across the whole career, for the trend chart. */
export function useCareerTrend(): TrendPoint[] {
  const stages = useLiveQuery(stagesQuery());
  const terms = useLiveQuery(allTermsQuery());
  const subjects = useLiveQuery(allSubjectsQuery());
  const categories = useLiveQuery(allCategoriesQuery());
  const grades = useLiveQuery(allGradesQuery());
  return useMemo(
    () =>
      careerTrend(
        stages.data ?? [],
        terms.data ?? [],
        subjects.data ?? [],
        categories.data ?? [],
        grades.data ?? [],
      ),
    [stages.data, terms.data, subjects.data, categories.data, grades.data],
  );
}
