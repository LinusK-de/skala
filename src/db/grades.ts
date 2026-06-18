/**
 * Grade CRUD plus the mapper that turns a stored row into the pure `GradeInput`
 * DTO the lib math consumes (the db layer owns this seam so lib stays DB-free).
 */
import { and, desc, eq } from 'drizzle-orm';

import type { GradeInput, Tendency } from '@/lib/grades';

import { db } from './client';
import { grades } from './schema';

export type Grade = typeof grades.$inferSelect;

export interface NewGradeInput {
  subjectId: number;
  categoryId: number | null;
  termId: number;
  value: number;
  tendency: number | null;
  weight?: number;
  date?: Date;
  note?: string | null;
  countsTowardAverage?: boolean;
}

/** Map a stored row into the DTO the lib averaging functions expect. */
export function toGradeInput(g: Grade): GradeInput {
  return {
    value: g.value,
    tendency: (g.tendency ?? null) as Tendency | null,
    weight: g.weight,
    categoryId: g.categoryId,
    countsTowardAverage: g.countsTowardAverage,
  };
}

export function listGradesForSubject(subjectId: number, termId?: number): Grade[] {
  const where =
    termId === undefined
      ? eq(grades.subjectId, subjectId)
      : and(eq(grades.subjectId, subjectId), eq(grades.termId, termId));
  return db.select().from(grades).where(where).orderBy(desc(grades.date)).all();
}

export function listGradesForTerm(termId: number): Grade[] {
  return db.select().from(grades).where(eq(grades.termId, termId)).orderBy(desc(grades.date)).all();
}

export function getGrade(id: number): Grade | null {
  return db.select().from(grades).where(eq(grades.id, id)).get() ?? null;
}

export function addGrade(input: NewGradeInput): number {
  const row = db
    .insert(grades)
    .values({
      subjectId: input.subjectId,
      categoryId: input.categoryId,
      termId: input.termId,
      value: input.value,
      tendency: input.tendency,
      weight: input.weight ?? 1,
      date: input.date ?? new Date(),
      note: input.note ?? null,
      countsTowardAverage: input.countsTowardAverage ?? true,
    })
    .returning({ id: grades.id })
    .get();
  return row.id;
}

export function updateGrade(
  id: number,
  patch: Partial<{
    categoryId: number | null;
    termId: number;
    value: number;
    tendency: number | null;
    weight: number;
    date: Date;
    note: string | null;
    countsTowardAverage: boolean;
  }>,
): void {
  db.update(grades).set(patch).where(eq(grades.id, id)).run();
}

export function deleteGrade(id: number): void {
  db.delete(grades).where(eq(grades.id, id)).run();
}
