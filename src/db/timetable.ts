/**
 * Timetable slots: the recurring weekly lessons. Sync functions (the expo-sqlite
 * drizzle driver is synchronous). A slot is keyed to a subject, so the timetable
 * is implicitly the current stage's subjects; the hooks filter by stage.
 */
import { asc, eq } from 'drizzle-orm';

import { db } from './client';
import { timetableSlots } from './schema';

export type TimetableSlot = typeof timetableSlots.$inferSelect;

export interface NewSlotInput {
  subjectId: number;
  weekday: number;
  period: number;
  startMin?: number | null;
  endMin?: number | null;
  room?: string | null;
}

export function listSlots(): TimetableSlot[] {
  return db
    .select()
    .from(timetableSlots)
    .orderBy(asc(timetableSlots.weekday), asc(timetableSlots.period))
    .all();
}

export function getSlot(id: number): TimetableSlot | null {
  return db.select().from(timetableSlots).where(eq(timetableSlots.id, id)).get() ?? null;
}

export function createSlot(input: NewSlotInput): number {
  const row = db
    .insert(timetableSlots)
    .values({
      subjectId: input.subjectId,
      weekday: input.weekday,
      period: input.period,
      startMin: input.startMin ?? null,
      endMin: input.endMin ?? null,
      room: input.room ?? null,
    })
    .returning({ id: timetableSlots.id })
    .get();
  return row.id;
}

export function updateSlot(
  id: number,
  patch: Partial<{
    subjectId: number;
    weekday: number;
    period: number;
    startMin: number | null;
    endMin: number | null;
    room: string | null;
  }>,
): void {
  db.update(timetableSlots).set(patch).where(eq(timetableSlots.id, id)).run();
}

export function deleteSlot(id: number): void {
  db.delete(timetableSlots).where(eq(timetableSlots.id, id)).run();
}
