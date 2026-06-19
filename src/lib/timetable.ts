/**
 * Pure helpers for the weekly timetable and homework due-dates. No React, no DB,
 * no I/O — same input → same output, so the "next lesson" suggestion and the due
 * grouping are trivially unit-testable. The DB rows are passed in structurally
 * (they satisfy the small `LessonSlot` shape), keeping this layer storage-free.
 */

/** 1 = Montag … 7 = Sonntag. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Weekdays the timetable covers (Mo–Sa). The UI iterates this. */
export const SCHEDULE_WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6];

const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;
const WEEKDAY_LONG = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
] as const;

/** A lesson's clock model when no explicit time is set: 1st period at 08:00, 45-min slots. */
const FIRST_PERIOD_START = 8 * 60;
const LESSON_MINUTES = 45;
const DAY_MS = 86_400_000;

/** The minimal slot shape the pure logic needs; DB rows satisfy it structurally. */
export interface LessonSlot {
  subjectId: number;
  weekday: number;
  period: number;
  startMin: number | null;
}

/** A concrete calendar occurrence of a recurring slot. */
export interface LessonOccurrence {
  slot: LessonSlot;
  date: Date;
}

/** Map a JS Date (getDay: 0=Sun…6=Sat) to our 1=Mo…7=So weekday. */
export function jsWeekday(date: Date): Weekday {
  const d = date.getDay();
  return (d === 0 ? 7 : d) as Weekday;
}

/** Short ("Mi") or long ("Mittwoch") German label for a 1..7 weekday. */
export function weekdayLabel(weekday: number, long = false): string {
  const i = weekday - 1;
  if (i < 0 || i > 6) return '';
  return (long ? WEEKDAY_LONG : WEEKDAY_SHORT)[i];
}

/** Minutes-from-midnight → "HH:MM". */
export function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}`;
}

/** A Date's time-of-day in minutes from midnight. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** The slot's start minute, falling back to a stable period-derived time for ordering. */
export function effectiveStartMin(slot: Pick<LessonSlot, 'startMin' | 'period'>): number {
  return slot.startMin ?? FIRST_PERIOD_START + (slot.period - 1) * LESSON_MINUTES;
}

/** Order slots within a day: by start time (period as fallback), then period. */
export function compareSlots(a: LessonSlot, b: LessonSlot): number {
  return effectiveStartMin(a) - effectiveStartMin(b) || a.period - b.period;
}

/** The slots on a given weekday, sorted for display. */
export function slotsForDay<T extends LessonSlot>(slots: T[], weekday: number): T[] {
  return slots.filter((s) => s.weekday === weekday).sort(compareSlots);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * The next `count` calendar occurrences of a subject's lessons strictly after
 * `from`, scanning up to three weeks ahead. Drives the "nächste/übernächste
 * Stunde" homework suggestion. Returns [] when the subject has no slots.
 */
export function nextLessonOccurrences(
  slots: LessonSlot[],
  subjectId: number,
  from: Date,
  count: number,
): LessonOccurrence[] {
  const mine = slots.filter((s) => s.subjectId === subjectId);
  if (mine.length === 0 || count <= 0) return [];

  const result: LessonOccurrence[] = [];
  const base = startOfDay(from);
  const fromMin = minutesOfDay(from);

  for (let offset = 0; offset < 21 && result.length < count; offset++) {
    // Step by calendar day (not fixed ms) so a DST transition can't shift the weekday.
    const day = new Date(base);
    day.setDate(base.getDate() + offset);
    const today = slotsForDay(mine, jsWeekday(day));
    for (const slot of today) {
      const startMin = effectiveStartMin(slot);
      if (offset === 0 && startMin <= fromMin) continue; // already passed today
      const date = new Date(day);
      date.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
      result.push({ slot, date });
      if (result.length >= count) break;
    }
  }
  return result;
}

/** A compact label for a suggested occurrence, e.g. "Mi, 08:00" or "Mi, 3. Stunde". */
export function occurrenceLabel(occ: LessonOccurrence): string {
  const day = weekdayLabel(occ.slot.weekday);
  const when =
    occ.slot.startMin != null ? formatTime(occ.slot.startMin) : `${occ.slot.period}. Std.`;
  return `${day}, ${when}`;
}

// --- Homework due-dates ----------------------------------------------------

export type DueBucket = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'none';

/** Whole-day difference (b − a), ignoring time-of-day. */
function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

/** Classify a due date relative to `now` for grouping/sorting the homework list. */
export function dueBucket(dueAt: number | null, now: Date): DueBucket {
  if (dueAt == null) return 'none';
  const diff = dayDiff(now, new Date(dueAt));
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 7) return 'week';
  return 'later';
}

const DUE_BUCKET_LABEL: Record<DueBucket, string> = {
  overdue: 'Überfällig',
  today: 'Heute',
  tomorrow: 'Morgen',
  week: 'Diese Woche',
  later: 'Später',
  none: 'Ohne Termin',
};

/** German section label for a due bucket. */
export function dueBucketLabel(bucket: DueBucket): string {
  return DUE_BUCKET_LABEL[bucket];
}

/** Sort order so the homework list reads overdue → today → … → later → undated. */
const BUCKET_ORDER: Record<DueBucket, number> = {
  overdue: 0,
  today: 1,
  tomorrow: 2,
  week: 3,
  later: 4,
  none: 5,
};

export function dueBucketOrder(bucket: DueBucket): number {
  return BUCKET_ORDER[bucket];
}

/** A friendly relative-or-dated label for a homework row, e.g. "Heute", "Mi, 18.06.". */
export function formatDueShort(dueAt: number | null, now: Date): string {
  if (dueAt == null) return 'Ohne Termin';
  const bucket = dueBucket(dueAt, now);
  if (bucket === 'today') return 'Heute';
  if (bucket === 'tomorrow') return 'Morgen';
  const d = new Date(dueAt);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${weekdayLabel(jsWeekday(d))}, ${p(d.getDate())}.${p(d.getMonth() + 1)}.`;
}
