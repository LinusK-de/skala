/**
 * Reactive hooks for the weekly timetable. Slots are stored per subject; here we
 * scope them to the current stage's (non-archived) subjects and group them by
 * weekday for the grid. Aggregation stays in pure lib helpers.
 */
import { useMemo } from 'react';

import { slotsQuery, subjectsQuery, useLiveQuery, type Subject, type TimetableSlot } from '@/db';
import { compareSlots, jsWeekday } from '@/lib/timetable';

import { useCurrentContext } from './useCareer';

export interface SlotWithSubject {
  slot: TimetableSlot;
  subject: Subject;
}

export interface TimetableData {
  stageId: number | null;
  subjects: Subject[];
  subjectById: Map<number, Subject>;
  /** Weekday (1..6) → that day's lessons, sorted by time/period. */
  slotsByWeekday: Map<number, SlotWithSubject[]>;
  /** Today's lessons (empty on weekends / days without lessons). */
  today: SlotWithSubject[];
  totalSlots: number;
}

export function useTimetable(): TimetableData {
  const { stage } = useCurrentContext();
  const stageId = stage?.id ?? null;
  const subjectsRes = useLiveQuery(subjectsQuery(stageId ?? -1), [stageId]);
  const slotsRes = useLiveQuery(slotsQuery());
  const todayWeekday = jsWeekday(new Date());

  return useMemo(() => {
    const subjects = subjectsRes.data ?? [];
    const subjectById = new Map(subjects.map((s) => [s.id, s]));

    const scoped: SlotWithSubject[] = [];
    for (const slot of slotsRes.data ?? []) {
      const subject = subjectById.get(slot.subjectId);
      if (subject) scoped.push({ slot, subject });
    }

    const slotsByWeekday = new Map<number, SlotWithSubject[]>();
    for (const item of scoped) {
      const list = slotsByWeekday.get(item.slot.weekday);
      if (list) list.push(item);
      else slotsByWeekday.set(item.slot.weekday, [item]);
    }
    for (const list of slotsByWeekday.values()) list.sort((a, b) => compareSlots(a.slot, b.slot));

    return {
      stageId,
      subjects,
      subjectById,
      slotsByWeekday,
      today: slotsByWeekday.get(todayWeekday) ?? [],
      totalSlots: scoped.length,
    };
  }, [subjectsRes.data, slotsRes.data, stageId, todayWeekday]);
}
