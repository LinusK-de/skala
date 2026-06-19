/**
 * Career structure: stages and their terms (Halbjahre). The expo-sqlite drizzle
 * driver is synchronous, so these are plain sync functions. Deletes cascade by
 * hand because SQLite (with foreign_keys off) does not — see deleteStage.
 */
import { asc, desc, eq, inArray, max } from 'drizzle-orm';

import { db } from './client';
import {
  gradeCategories,
  grades,
  homework,
  stages,
  subjects,
  terms,
  timetableSlots,
} from './schema';

export type Stage = typeof stages.$inferSelect;
export type Term = typeof terms.$inferSelect;

export interface NewStageInput {
  name: string;
  schoolType: string;
  scale: string;
  gradeFrom: number;
  gradeTo: number;
}

export function listStages(): Stage[] {
  return db.select().from(stages).orderBy(asc(stages.sortOrder)).all();
}

export function getStage(id: number): Stage | null {
  return db.select().from(stages).where(eq(stages.id, id)).get() ?? null;
}

export function createStage(input: NewStageInput): number {
  const agg = db
    .select({ m: max(stages.sortOrder) })
    .from(stages)
    .get();
  const sortOrder = (agg?.m ?? -1) + 1;
  const row = db
    .insert(stages)
    .values({ ...input, sortOrder, startedAt: new Date() })
    .returning({ id: stages.id })
    .get();
  return row.id;
}

export function updateStage(
  id: number,
  patch: Partial<NewStageInput> & { endedAt?: Date | null },
): void {
  db.update(stages).set(patch).where(eq(stages.id, id)).run();
}

/** Delete a stage and everything beneath it (terms, subjects, categories, grades). */
export function deleteStage(id: number): void {
  db.transaction((tx) => {
    const subjectIds = tx
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.stageId, id))
      .all()
      .map((s) => s.id);
    if (subjectIds.length > 0) {
      tx.delete(grades).where(inArray(grades.subjectId, subjectIds)).run();
      tx.delete(gradeCategories).where(inArray(gradeCategories.subjectId, subjectIds)).run();
      // foreign_keys is off — remove the subjects' timetable slots + homework by hand.
      tx.delete(homework).where(inArray(homework.subjectId, subjectIds)).run();
      tx.delete(timetableSlots).where(inArray(timetableSlots.subjectId, subjectIds)).run();
    }
    tx.delete(subjects).where(eq(subjects.stageId, id)).run();
    tx.delete(terms).where(eq(terms.stageId, id)).run();
    tx.delete(stages).where(eq(stages.id, id)).run();
  });
  ensureCurrentTerm();
}

export function listTerms(stageId: number): Term[] {
  return db
    .select()
    .from(terms)
    .where(eq(terms.stageId, stageId))
    .orderBy(asc(terms.sortOrder))
    .all();
}

export function listAllTerms(): Term[] {
  return db.select().from(terms).orderBy(asc(terms.sortOrder)).all();
}

export function getCurrentTerm(): Term | null {
  return db.select().from(terms).where(eq(terms.isCurrent, true)).get() ?? null;
}

export function getCurrentStage(): Stage | null {
  const term = getCurrentTerm();
  return term ? getStage(term.stageId) : null;
}

export interface NewTermInput {
  stageId: number;
  schoolYear: string;
  gradeLevel: number;
  half: number;
  label: string;
}

export function createTerm(input: NewTermInput, makeCurrent = false): number {
  const agg = db
    .select({ m: max(terms.sortOrder) })
    .from(terms)
    .get();
  const sortOrder = (agg?.m ?? -1) + 1;
  const row = db
    .insert(terms)
    .values({ ...input, sortOrder })
    .returning({ id: terms.id })
    .get();
  if (makeCurrent) setCurrentTerm(row.id);
  return row.id;
}

/** Make exactly one term the current context. */
export function setCurrentTerm(id: number): void {
  db.transaction((tx) => {
    tx.update(terms).set({ isCurrent: false }).run();
    tx.update(terms).set({ isCurrent: true }).where(eq(terms.id, id)).run();
  });
}

/** After a delete, fall back to the latest remaining term if none is current. */
export function ensureCurrentTerm(): void {
  if (getCurrentTerm()) return;
  const last = db.select().from(terms).orderBy(desc(terms.sortOrder)).get();
  if (last) setCurrentTerm(last.id);
}

export function deleteTerm(id: number): void {
  db.transaction((tx) => {
    tx.delete(grades).where(eq(grades.termId, id)).run();
    tx.delete(terms).where(eq(terms.id, id)).run();
  });
  ensureCurrentTerm();
}
