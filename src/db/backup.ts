/**
 * Local backup: serialize every grade table to a plain JSON object and restore it.
 * Since the app is local-first with no cloud, this is the only thing standing
 * between a lost phone and years of lost grades — so it ships free. Timestamps
 * are stored as epoch-ms numbers to survive the JSON round-trip.
 */
import { eq } from 'drizzle-orm';

import { ensureCurrentTerm } from './career';
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

// v2 added the timetable_slots + homework tables. v1 files (without them) still
// import — the new arrays are treated as empty so old backups never break.
const BACKUP_VERSION = 2;

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
interface SerTimetableSlot {
  id: number;
  subjectId: number;
  weekday: number;
  period: number;
  startMin: number | null;
  endMin: number | null;
  room: string | null;
  createdAt: number;
}
interface SerHomework {
  id: number;
  subjectId: number;
  title: string;
  dueAt: number | null;
  done: boolean;
  completedAt: number | null;
  note: string | null;
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
  // Optional so a v1 file (which lacks them) still satisfies the shape on import.
  timetableSlots?: SerTimetableSlot[];
  homework?: SerHomework[];
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
    timetableSlots: db
      .select()
      .from(timetableSlots)
      .all()
      .map((s) => ({
        id: s.id,
        subjectId: s.subjectId,
        weekday: s.weekday,
        period: s.period,
        startMin: s.startMin,
        endMin: s.endMin,
        room: s.room,
        createdAt: s.createdAt.getTime(),
      })),
    homework: db
      .select()
      .from(homework)
      .all()
      .map((h) => ({
        id: h.id,
        subjectId: h.subjectId,
        title: h.title,
        dueAt: ms(h.dueAt),
        done: h.done,
        completedAt: ms(h.completedAt),
        note: h.note,
        createdAt: h.createdAt.getTime(),
      })),
  };
}

/** True when the parsed object has the shape we can restore (v1 or v2). */
export function isBackupData(value: unknown): value is BackupData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.version === 1 || v.version === 2) &&
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
    // Delete child tables before subjects (foreign_keys is off, so no auto-cascade).
    tx.delete(homework).run();
    tx.delete(timetableSlots).run();
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
    (data.timetableSlots ?? []).forEach((s) =>
      tx
        .insert(timetableSlots)
        .values({ ...s, createdAt: new Date(s.createdAt) })
        .run(),
    );
    (data.homework ?? []).forEach((h) =>
      tx
        .insert(homework)
        .values({
          ...h,
          dueAt: date(h.dueAt),
          completedAt: date(h.completedAt),
          createdAt: new Date(h.createdAt),
        })
        .run(),
    );

    // Make restore authoritative against the file: at most one current term.
    const chosen = data.terms.find((t) => t.isCurrent);
    tx.update(terms).set({ isCurrent: false }).run();
    if (chosen) tx.update(terms).set({ isCurrent: true }).where(eq(terms.id, chosen.id)).run();
  });
  // Covers the case where the file had terms but none flagged current.
  ensureCurrentTerm();
}
