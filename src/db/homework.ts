/**
 * Homework CRUD. Each item is keyed to a subject and carries a `dueAt` (usually
 * the subject's next lesson date, or a manual date). `done` is toggled in place so
 * a finished item stays visible (struck through) until the user clears it.
 */
import { eq } from 'drizzle-orm';

import { db } from './client';
import { homework } from './schema';

export type Homework = typeof homework.$inferSelect;

export interface NewHomeworkInput {
  subjectId: number;
  title: string;
  dueAt?: Date | null;
  note?: string | null;
}

export function getHomework(id: number): Homework | null {
  return db.select().from(homework).where(eq(homework.id, id)).get() ?? null;
}

export function addHomework(input: NewHomeworkInput): number {
  const row = db
    .insert(homework)
    .values({
      subjectId: input.subjectId,
      title: input.title,
      dueAt: input.dueAt ?? null,
      note: input.note ?? null,
    })
    .returning({ id: homework.id })
    .get();
  return row.id;
}

export function updateHomework(
  id: number,
  patch: Partial<{
    subjectId: number;
    title: string;
    dueAt: Date | null;
    note: string | null;
    done: boolean;
    completedAt: Date | null;
  }>,
): void {
  db.update(homework).set(patch).where(eq(homework.id, id)).run();
}

/** Toggle done, stamping the completion time so it can be shown/sorted later. */
export function setHomeworkDone(id: number, done: boolean): void {
  db.update(homework)
    .set({ done, completedAt: done ? new Date() : null })
    .where(eq(homework.id, id))
    .run();
}

export function deleteHomework(id: number): void {
  db.delete(homework).where(eq(homework.id, id)).run();
}

/** Remove every completed item (the "Erledigte aufräumen" action). */
export function clearCompletedHomework(): void {
  db.delete(homework).where(eq(homework.done, true)).run();
}
