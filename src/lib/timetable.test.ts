import {
  compareSlots,
  dueBucket,
  dueBucketLabel,
  dueBucketOrder,
  effectiveStartMin,
  formatDueShort,
  formatTime,
  jsWeekday,
  minutesOfDay,
  nextLessonOccurrences,
  occurrenceLabel,
  slotsForDay,
  weekdayLabel,
  type LessonSlot,
} from './timetable';

// 2026-06-15 is a Monday — used as the deterministic anchor throughout.
const MON = new Date(2026, 5, 15, 7, 0);

const slot = (
  subjectId: number,
  weekday: number,
  period: number,
  startMin: number | null = null,
): LessonSlot => ({
  subjectId,
  weekday,
  period,
  startMin,
});

describe('jsWeekday', () => {
  it('maps Sunday to 7 and keeps Mon–Sat as 1–6', () => {
    expect(jsWeekday(new Date(2026, 5, 15))).toBe(1); // Monday
    expect(jsWeekday(new Date(2026, 5, 20))).toBe(6); // Saturday
    expect(jsWeekday(new Date(2026, 5, 21))).toBe(7); // Sunday
  });
});

describe('weekdayLabel', () => {
  it('returns short and long German labels', () => {
    expect(weekdayLabel(3)).toBe('Mi');
    expect(weekdayLabel(3, true)).toBe('Mittwoch');
    expect(weekdayLabel(7)).toBe('So');
  });
  it('returns empty for out-of-range', () => {
    expect(weekdayLabel(0)).toBe('');
    expect(weekdayLabel(8)).toBe('');
  });
});

describe('formatTime / minutesOfDay', () => {
  it('formats minutes as HH:MM', () => {
    expect(formatTime(480)).toBe('08:00');
    expect(formatTime(545)).toBe('09:05');
    expect(formatTime(0)).toBe('00:00');
  });
  it('reads a Date time-of-day in minutes', () => {
    expect(minutesOfDay(new Date(2026, 5, 15, 9, 5))).toBe(545);
  });
});

describe('effectiveStartMin', () => {
  it('uses the explicit time when set', () => {
    expect(effectiveStartMin({ startMin: 600, period: 1 })).toBe(600);
  });
  it('derives a stable time from the period otherwise', () => {
    expect(effectiveStartMin({ startMin: null, period: 1 })).toBe(8 * 60);
    expect(effectiveStartMin({ startMin: null, period: 3 })).toBe(8 * 60 + 2 * 45);
  });
});

describe('compareSlots / slotsForDay', () => {
  it('orders a day by start time then period', () => {
    const slots = [slot(1, 1, 3), slot(2, 1, 1), slot(3, 2, 1)];
    const day = slotsForDay(slots, 1);
    expect(day.map((s) => s.subjectId)).toEqual([2, 1]);
  });
  it('compareSlots is a stable comparator', () => {
    expect(compareSlots(slot(1, 1, 1), slot(2, 1, 2))).toBeLessThan(0);
  });
});

describe('nextLessonOccurrences', () => {
  const slots = [slot(1, 1, 1, 480), slot(1, 3, 3, 600), slot(2, 2, 2)];

  it('returns the next occurrences strictly after `from`', () => {
    const occ = nextLessonOccurrences(slots, 1, MON, 2);
    expect(occ).toHaveLength(2);
    expect(occ[0].date).toEqual(new Date(2026, 5, 15, 8, 0)); // Mon 08:00
    expect(occ[1].date).toEqual(new Date(2026, 5, 17, 10, 0)); // Wed 10:00
  });

  it('skips a lesson that already passed today', () => {
    const after = new Date(2026, 5, 15, 9, 0); // after the 08:00 Monday lesson
    const occ = nextLessonOccurrences(slots, 1, after, 1);
    expect(occ[0].date).toEqual(new Date(2026, 5, 17, 10, 0)); // Wed 10:00
  });

  it('returns [] for a subject with no slots', () => {
    expect(nextLessonOccurrences(slots, 99, MON, 2)).toEqual([]);
  });

  it('scans across weeks for a rarely-taught subject', () => {
    const sat = [slot(3, 6, 1)]; // only Saturdays, no explicit time
    const occ = nextLessonOccurrences(sat, 3, MON, 2);
    expect(occ).toHaveLength(2);
    expect(occ[0].date.getDate()).toBe(20); // Sat 2026-06-20
    expect(occ[1].date.getDate()).toBe(27); // Sat 2026-06-27
  });

  it('yields distinct, weekly-spaced occurrences for a single-weekday subject', () => {
    const wed = [slot(1, 3, 1, 480)]; // Wednesdays only, 08:00
    const occ = nextLessonOccurrences(wed, 1, MON, 3);
    expect(occ).toHaveLength(3);
    const days = occ.map((o) => o.date.getTime());
    expect(new Set(days).size).toBe(3); // no duplicates from the day-stepping
    expect(days[1] - days[0]).toBe(7 * 86_400_000);
    expect(days[2] - days[1]).toBe(7 * 86_400_000);
    occ.forEach((o) => expect(o.date.getDay()).toBe(3)); // always a Wednesday
  });
});

describe('occurrenceLabel', () => {
  it('shows the time when present, else the period', () => {
    expect(occurrenceLabel({ slot: slot(1, 3, 2, 600), date: new Date(2026, 5, 17) })).toBe(
      'Mi, 10:00',
    );
    expect(occurrenceLabel({ slot: slot(1, 1, 2), date: new Date(2026, 5, 15) })).toBe(
      'Mo, 2. Std.',
    );
  });
});

describe('dueBucket', () => {
  const now = new Date(2026, 5, 15, 12, 0);
  const at = (d: number) => new Date(2026, 5, d).getTime();

  it('classifies relative to today', () => {
    expect(dueBucket(at(14), now)).toBe('overdue');
    expect(dueBucket(at(15), now)).toBe('today');
    expect(dueBucket(at(16), now)).toBe('tomorrow');
    expect(dueBucket(at(20), now)).toBe('week');
    expect(dueBucket(at(25), now)).toBe('later');
    expect(dueBucket(null, now)).toBe('none');
  });

  it('exposes German labels and a stable sort order', () => {
    expect(dueBucketLabel('overdue')).toBe('Überfällig');
    expect(dueBucketLabel('none')).toBe('Ohne Termin');
    expect(dueBucketOrder('overdue')).toBeLessThan(dueBucketOrder('today'));
    expect(dueBucketOrder('later')).toBeLessThan(dueBucketOrder('none'));
  });
});

describe('formatDueShort', () => {
  const now = new Date(2026, 5, 15, 12, 0);
  it('uses relative words then falls back to a dated label', () => {
    expect(formatDueShort(new Date(2026, 5, 15).getTime(), now)).toBe('Heute');
    expect(formatDueShort(new Date(2026, 5, 16).getTime(), now)).toBe('Morgen');
    expect(formatDueShort(new Date(2026, 5, 17).getTime(), now)).toBe('Mi, 17.06.');
    expect(formatDueShort(null, now)).toBe('Ohne Termin');
  });
});
