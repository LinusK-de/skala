/**
 * Local backup: serialize every grade table to a plain JSON object and restore it.
 * Since the app is local-first with no cloud, this is the only thing standing
 * between a lost phone and years of lost grades — so it ships free. Timestamps
 * are stored as epoch-ms numbers to survive the JSON round-trip.
 */
import { ensureCurrentTerm } from './career';
import { db } from './client';
import { gradeCategories, grades, stages, subjects, terms } from './schema';

const BACKUP_VERSION = 1;

interface SerStage {
  id: number;
  name: string;
  schoolType: string;
  scale: string;
  gradeFrom: number;
  gradeTo: number;
  sortOrder: number;
  startedAt: number | null;
  endedAt: number | null;
  createdAt: number;
}
interface SerTerm {
  id: number;
  stageId: number;
  schoolYear: string;
  gradeLevel: number;
  half: number;
  label: string;
  sortOrder: number;
  isCurrent: boolean;
  createdAt: number;
}
interface SerSubject {
  id: number;
  stageId: number;
  name: string;
  colorKey: string;
  isCore: boolean;
  writtenWeight: number;
  oralWeight: number;
  targetGrade: number | null;
  sortOrder: number;
  archivedAt: number | null;
  createdAt: number;
}
interface SerCategory {
  id: number;
  subjectId: number;
  name: string;
  type: string;
  weight: number;
  sortOrder: number;
}
interface SerGrade {
  id: number;
  subjectId: number;
  categoryId: number | null;
  termId: number;
  value: number;
  tendency: number | null;
  weight: number;
  date: number;
  note: string | null;
  countsTowardAverage: boolean;
  createdAt: number;
}

export interface BackupData {
  version: number;
  exportedAt: number;
  stages: SerStage[];
  terms: SerTerm[];
  subjects: SerSubject[];
  categories: SerCategory[];
  grades: SerGrade[];
}

const ms = (d: Date | null): number | null => (d ? d.getTime() : null);

/** Read the whole database into a serializable object. */
export function serializeDatabase(exportedAt: Date): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: exportedAt.getTime(),
    stages: db
      .select()
      .from(stages)
      .all()
      .map((s) => ({
        id: s.id,
        name: s.name,
        schoolType: s.schoolType,
        scale: s.scale,
        gradeFrom: s.gradeFrom,
        gradeTo: s.gradeTo,
        sortOrder: s.sortOrder,
        startedAt: ms(s.startedAt),
        endedAt: ms(s.endedAt),
        createdAt: s.createdAt.getTime(),
      })),
    terms: db
      .select()
      .from(terms)
      .all()
      .map((t) => ({
        id: t.id,
        stageId: t.stageId,
        schoolYear: t.schoolYear,
        gradeLevel: t.gradeLevel,
        half: t.half,
        label: t.label,
        sortOrder: t.sortOrder,
        isCurrent: t.isCurrent,
        createdAt: t.createdAt.getTime(),
      })),
    subjects: db
      .select()
      .from(subjects)
      .all()
      .map((s) => ({
        id: s.id,
        stageId: s.stageId,
        name: s.name,
        colorKey: s.colorKey,
        isCore: s.isCore,
        writtenWeight: s.writtenWeight,
        oralWeight: s.oralWeight,
        targetGrade: s.targetGrade,
        sortOrder: s.sortOrder,
        archivedAt: ms(s.archivedAt),
        createdAt: s.createdAt.getTime(),
      })),
    categories: db
      .select()
      .from(gradeCategories)
      .all()
      .map((c) => ({
        id: c.id,
        subjectId: c.subjectId,
        name: c.name,
        type: c.type,
        weight: c.weight,
        sortOrder: c.sortOrder,
      })),
    grades: db
      .select()
      .from(grades)
      .all()
      .map((g) => ({
        id: g.id,
        subjectId: g.subjectId,
        categoryId: g.categoryId,
        termId: g.termId,
        value: g.value,
        tendency: g.tendency,
        weight: g.weight,
        date: g.date.getTime(),
        note: g.note,
        countsTowardAverage: g.countsTowardAverage,
        createdAt: g.createdAt.getTime(),
      })),
  };
}

/** True when the parsed object has the shape we can restore. */
export function isBackupData(value: unknown): value is BackupData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === 'number' &&
    Array.isArray(v.stages) &&
    Array.isArray(v.terms) &&
    Array.isArray(v.subjects) &&
    Array.isArray(v.categories) &&
    Array.isArray(v.grades)
  );
}

const date = (n: number | null): Date | null => (n === null ? null : new Date(n));

/** Replace ALL data with the backup. Validate BEFORE wiping so a bad file is a no-op. */
export function restoreDatabase(data: BackupData): void {
  db.transaction((tx) => {
    tx.delete(grades).run();
    tx.delete(gradeCategories).run();
    tx.delete(subjects).run();
    tx.delete(terms).run();
    tx.delete(stages).run();

    data.stages.forEach((s) =>
      tx
        .insert(stages)
        .values({
          ...s,
          startedAt: date(s.startedAt),
          endedAt: date(s.endedAt),
          createdAt: new Date(s.createdAt),
        })
        .run(),
    );
    data.terms.forEach((t) =>
      tx
        .insert(terms)
        .values({ ...t, createdAt: new Date(t.createdAt) })
        .run(),
    );
    data.subjects.forEach((s) =>
      tx
        .insert(subjects)
        .values({ ...s, archivedAt: date(s.archivedAt), createdAt: new Date(s.createdAt) })
        .run(),
    );
    data.categories.forEach((c) =>
      tx
        .insert(gradeCategories)
        .values({ ...c, type: c.type })
        .run(),
    );
    data.grades.forEach((g) =>
      tx
        .insert(grades)
        .values({ ...g, date: new Date(g.date), createdAt: new Date(g.createdAt) })
        .run(),
    );
  });
  ensureCurrentTerm();
}
