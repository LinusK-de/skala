/**
 * Subjects and their grade categories. Creating a subject seeds a sane default
 * category set for the stage's scale (from the pure lib presets). Subjects are
 * SOFT-deleted (archived) by default so historical term averages survive; a hard
 * delete cascades to its categories, grades, timetable slots and homework.
 */
import { and, asc, eq, isNull, max } from 'drizzle-orm';

import { defaultCategoriesFor, type CategoryType, type Scale } from '@/lib/grades';

import { db } from './client';
import { gradeCategories, grades, homework, subjects, timetableSlots } from './schema';

export type Subject = typeof subjects.$inferSelect;
export type GradeCategory = typeof gradeCategories.$inferSelect;

export interface NewSubjectInput {
  stageId: number;
  name: string;
  scale: Scale;
  isCore?: boolean;
  writtenWeight?: number;
  oralWeight?: number;
  colorKey?: string;
  targetGrade?: number | null;
}

export function listSubjects(stageId: number, includeArchived = false): Subject[] {
  const where = includeArchived
    ? eq(subjects.stageId, stageId)
    : and(eq(subjects.stageId, stageId), isNull(subjects.archivedAt));
  return db.select().from(subjects).where(where).orderBy(asc(subjects.sortOrder)).all();
}

export function getSubject(id: number): Subject | null {
  return db.select().from(subjects).where(eq(subjects.id, id)).get() ?? null;
}

export function createSubject(input: NewSubjectInput): number {
  return db.transaction((tx) => {
    const agg = tx
      .select({ m: max(subjects.sortOrder) })
      .from(subjects)
      .where(eq(subjects.stageId, input.stageId))
      .get();
    const sortOrder = (agg?.m ?? -1) + 1;
    const row = tx
      .insert(subjects)
      .values({
        stageId: input.stageId,
        name: input.name,
        isCore: input.isCore ?? false,
        writtenWeight: input.writtenWeight ?? 1,
        oralWeight: input.oralWeight ?? 1,
        colorKey: input.colorKey ?? 'accent1',
        targetGrade: input.targetGrade ?? null,
        sortOrder,
      })
      .returning({ id: subjects.id })
      .get();

    defaultCategoriesFor(input.scale).forEach((seed, i) => {
      tx.insert(gradeCategories)
        .values({
          subjectId: row.id,
          name: seed.name,
          type: seed.type,
          weight: seed.weight,
          sortOrder: i,
        })
        .run();
    });
    return row.id;
  });
}

export function updateSubject(
  id: number,
  patch: Partial<{
    name: string;
    isCore: boolean;
    writtenWeight: number;
    oralWeight: number;
    colorKey: string;
    targetGrade: number | null;
  }>,
): void {
  db.update(subjects).set(patch).where(eq(subjects.id, id)).run();
}

export function archiveSubject(id: number): void {
  db.update(subjects).set({ archivedAt: new Date() }).where(eq(subjects.id, id)).run();
}

export function unarchiveSubject(id: number): void {
  db.update(subjects).set({ archivedAt: null }).where(eq(subjects.id, id)).run();
}

export function deleteSubject(id: number): void {
  db.transaction((tx) => {
    tx.delete(grades).where(eq(grades.subjectId, id)).run();
    tx.delete(gradeCategories).where(eq(gradeCategories.subjectId, id)).run();
    // foreign_keys is off, so the timetable/homework cascade must be done by hand.
    tx.delete(homework).where(eq(homework.subjectId, id)).run();
    tx.delete(timetableSlots).where(eq(timetableSlots.subjectId, id)).run();
    tx.delete(subjects).where(eq(subjects.id, id)).run();
  });
}

export function reorderSubjects(orderedIds: number[]): void {
  db.transaction((tx) => {
    orderedIds.forEach((id, i) => {
      tx.update(subjects).set({ sortOrder: i }).where(eq(subjects.id, id)).run();
    });
  });
}

// --- Categories -----------------------------------------------------------

export function listCategories(subjectId: number): GradeCategory[] {
  return db
    .select()
    .from(gradeCategories)
    .where(eq(gradeCategories.subjectId, subjectId))
    .orderBy(asc(gradeCategories.sortOrder))
    .all();
}

export function createCategory(input: {
  subjectId: number;
  name: string;
  type: CategoryType;
  weight?: number;
}): number {
  const agg = db
    .select({ m: max(gradeCategories.sortOrder) })
    .from(gradeCategories)
    .where(eq(gradeCategories.subjectId, input.subjectId))
    .get();
  const sortOrder = (agg?.m ?? -1) + 1;
  const row = db
    .insert(gradeCategories)
    .values({
      subjectId: input.subjectId,
      name: input.name,
      type: input.type,
      weight: input.weight ?? 1,
      sortOrder,
    })
    .returning({ id: gradeCategories.id })
    .get();
  return row.id;
}

export function updateCategory(
  id: number,
  patch: Partial<{ name: string; type: CategoryType; weight: number }>,
): void {
  db.update(gradeCategories).set(patch).where(eq(gradeCategories.id, id)).run();
}

export function deleteCategory(id: number): void {
  db.transaction((tx) => {
    // Keep the grades, just detach them from the removed category.
    tx.update(grades).set({ categoryId: null }).where(eq(grades.categoryId, id)).run();
    tx.delete(gradeCategories).where(eq(gradeCategories.id, id)).run();
  });
}
