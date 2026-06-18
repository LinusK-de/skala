/**
 * Query factories for the reactive read layer. Each returns an UN-executed Drizzle
 * query that a hook hands to `useLiveQuery`, which re-runs it on any write (the db
 * is opened with `enableChangeListener: true`). Keeping the table refs here means
 * hooks never import drizzle or the schema directly.
 */
import { and, asc, desc, eq, isNull } from 'drizzle-orm';

import { db } from './client';
import { gradeCategories, grades, stages, subjects, terms } from './schema';

// The React adapter lives behind the db seam so hooks never import drizzle directly.
export { useLiveQuery } from 'drizzle-orm/expo-sqlite';

export const stagesQuery = () => db.select().from(stages).orderBy(asc(stages.sortOrder));

export const allTermsQuery = () => db.select().from(terms).orderBy(asc(terms.sortOrder));

export const termsForStageQuery = (stageId: number) =>
  db.select().from(terms).where(eq(terms.stageId, stageId)).orderBy(asc(terms.sortOrder));

export const currentTermQuery = () => db.select().from(terms).where(eq(terms.isCurrent, true));

export const subjectsQuery = (stageId: number) =>
  db
    .select()
    .from(subjects)
    .where(and(eq(subjects.stageId, stageId), isNull(subjects.archivedAt)))
    .orderBy(asc(subjects.sortOrder));

export const allSubjectsForStageQuery = (stageId: number) =>
  db.select().from(subjects).where(eq(subjects.stageId, stageId)).orderBy(asc(subjects.sortOrder));

export const subjectQuery = (id: number) => db.select().from(subjects).where(eq(subjects.id, id));

export const categoriesQuery = (subjectId: number) =>
  db
    .select()
    .from(gradeCategories)
    .where(eq(gradeCategories.subjectId, subjectId))
    .orderBy(asc(gradeCategories.sortOrder));

export const gradesForTermQuery = (termId: number) =>
  db.select().from(grades).where(eq(grades.termId, termId)).orderBy(desc(grades.date));

export const gradesForSubjectQuery = (subjectId: number) =>
  db.select().from(grades).where(eq(grades.subjectId, subjectId)).orderBy(desc(grades.date));

// Whole-table queries powering the career overview (everything in memory; the
// per-student data set is small). Includes archived subjects for historical math.
export const allSubjectsQuery = () => db.select().from(subjects).orderBy(asc(subjects.sortOrder));

export const allCategoriesQuery = () => db.select().from(gradeCategories);

export const allGradesQuery = () => db.select().from(grades);
