/**
 * Reactive hooks for homework. Items are scoped to the CURRENT stage's subjects
 * (mirroring useTimetable) so homework from past/other stages never leaks in,
 * classified into due-buckets by the pure lib, and split into an open list
 * (grouped overdue → today → … → undated) and a done list.
 */
import { useMemo } from 'react';

import { homeworkQuery, subjectsQuery, useLiveQuery, type Homework, type Subject } from '@/db';
import { dueBucket, dueBucketOrder, type DueBucket } from '@/lib/timetable';

import { useCurrentContext } from './useCareer';

export interface HomeworkWithSubject {
  item: Homework;
  subject: Subject | null;
  bucket: DueBucket;
}

export interface HomeworkGroup {
  bucket: DueBucket;
  items: HomeworkWithSubject[];
}

export interface HomeworkData {
  open: HomeworkWithSubject[];
  done: HomeworkWithSubject[];
  groups: HomeworkGroup[];
  openCount: number;
  overdueCount: number;
  /** Open-homework count per subject — drives the timetable's "fällig" markers. */
  openCountBySubject: Map<number, number>;
}

function compareDue(a: HomeworkWithSubject, b: HomeworkWithSubject): number {
  const byBucket = dueBucketOrder(a.bucket) - dueBucketOrder(b.bucket);
  if (byBucket !== 0) return byBucket;
  const ad = a.item.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const bd = b.item.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
  return ad - bd;
}

export function useHomework(): HomeworkData {
  const { stage } = useCurrentContext();
  const stageId = stage?.id ?? null;
  const homeworkRes = useLiveQuery(homeworkQuery());
  const subjectsRes = useLiveQuery(subjectsQuery(stageId ?? -1), [stageId]);
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  return useMemo(() => {
    const today = new Date();
    const subjectById = new Map((subjectsRes.data ?? []).map((s) => [s.id, s]));

    // Only the current stage's subjects — homework bound to a past stage's subject
    // (subjects are per-stage rows) is filtered out, not counted as overdue forever.
    const all: HomeworkWithSubject[] = (homeworkRes.data ?? [])
      .filter((item) => subjectById.has(item.subjectId))
      .map((item) => ({
        item,
        subject: subjectById.get(item.subjectId) ?? null,
        bucket: dueBucket(item.dueAt ? item.dueAt.getTime() : null, today),
      }));

    const open = all.filter((h) => !h.item.done).sort(compareDue);
    const done = all
      .filter((h) => h.item.done)
      .sort((a, b) => (b.item.completedAt?.getTime() ?? 0) - (a.item.completedAt?.getTime() ?? 0));

    const groups: HomeworkGroup[] = [];
    for (const h of open) {
      const last = groups[groups.length - 1];
      if (last && last.bucket === h.bucket) last.items.push(h);
      else groups.push({ bucket: h.bucket, items: [h] });
    }

    const openCountBySubject = new Map<number, number>();
    for (const h of open) {
      openCountBySubject.set(h.item.subjectId, (openCountBySubject.get(h.item.subjectId) ?? 0) + 1);
    }

    return {
      open,
      done,
      groups,
      openCount: open.length,
      overdueCount: open.filter((h) => h.bucket === 'overdue').length,
      openCountBySubject,
    };
    // `todayKey` re-runs the memo across a midnight rollover; data identity covers the rest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeworkRes.data, subjectsRes.data, todayKey]);
}
