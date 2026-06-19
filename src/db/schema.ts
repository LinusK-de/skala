import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Generic key-value store for app preferences (theme mode, the one-time "pro"
 * unlock flag, onboarding-done flag, rounding preference, …). One row per
 * setting. Never overloaded with grade data — that lives in its own tables.
 */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
});

/**
 * One segment of the school career. `scale` is THE switch that decides which
 * grade math applies to everything below it — it is fixed per stage, never per
 * grade, so a whole Oberstufe is points and a whole Sek-I is 1–6 unambiguously.
 */
export const stages = sqliteTable('stages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  /** SchoolType from lib/grades/presets: 'realschule' | 'oberstufe' | … */
  schoolType: text('school_type').notNull(),
  /** 'grades_1_6' | 'points_0_15' */
  scale: text('scale').notNull(),
  gradeFrom: integer('grade_from').notNull(),
  gradeTo: integer('grade_to').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }),
  endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * A Halbjahr — the atomic reporting unit. A school year has two (half 1|2).
 * Exactly one term across the whole app is `isCurrent`; it defines the default
 * context (and, via its stage, the current stage). Year/stage aggregates are
 * computed in lib from the terms, never stored.
 */
export const terms = sqliteTable(
  'terms',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    stageId: integer('stage_id')
      .notNull()
      .references(() => stages.id, { onDelete: 'cascade' }),
    /** e.g. "2025/26" — a school year spans two calendar years. */
    schoolYear: text('school_year').notNull(),
    gradeLevel: integer('grade_level').notNull(),
    /** 1 = erstes Halbjahr, 2 = zweites Halbjahr. */
    half: integer('half').notNull(),
    /** Display label, e.g. "11/1". */
    label: text('label').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isCurrent: integer('is_current', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('terms_stage_idx').on(t.stageId)],
);

/**
 * A subject within a stage. The same subject recurring in a later stage is a new
 * row (different scale, different weights). `archivedAt` soft-deletes a subject so
 * historical term averages survive. `writtenWeight:oralWeight` is the
 * schriftlich/mündlich block ratio.
 */
export const subjects = sqliteTable(
  'subjects',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    stageId: integer('stage_id')
      .notNull()
      .references(() => stages.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Maps to a muted theme chart accent, not a raw hex. */
    colorKey: text('color_key').notNull().default('accent1'),
    isCore: integer('is_core', { mode: 'boolean' }).notNull().default(false),
    writtenWeight: real('written_weight').notNull().default(1),
    oralWeight: real('oral_weight').notNull().default(1),
    /** Optional Zielnote in the native scale (decimal grade or points). */
    targetGrade: real('target_grade'),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('subjects_stage_idx').on(t.stageId)],
);

/**
 * The Klausur/mündlich/Test/Projekt taxonomy with weights, per subject (so the
 * weighting can differ by Fach/Bundesland). `type` drives which block the
 * category aggregates into. Seeded with sane defaults when a subject is created.
 */
export const gradeCategories = sqliteTable(
  'grade_categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subjectId: integer('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** 'written' | 'oral' | 'other' */
    type: text('type').notNull().default('written'),
    weight: real('weight').notNull().default(1),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('grade_categories_subject_idx').on(t.subjectId)],
);

/**
 * The leaf: one entered mark. Stores the RAW input (value + optional tendency);
 * the decimal/points math is derived in lib at read time, never persisted.
 */
export const grades = sqliteTable(
  'grades',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subjectId: integer('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id').references(() => gradeCategories.id, {
      onDelete: 'set null',
    }),
    termId: integer('term_id')
      .notNull()
      .references(() => terms.id, { onDelete: 'cascade' }),
    /** 1..6 on the grade scale, 0..15 on the points scale. */
    value: real('value').notNull(),
    /** -1 = '+', 0 = plain, 1 = '-'; null on the points scale. */
    tendency: integer('tendency'),
    weight: real('weight').notNull().default(1),
    date: integer('date', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    note: text('note'),
    countsTowardAverage: integer('counts_toward_average', { mode: 'boolean' })
      .notNull()
      .default(true),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index('grades_subject_idx').on(t.subjectId),
    index('grades_term_idx').on(t.termId),
    index('grades_category_idx').on(t.categoryId),
  ],
);

/**
 * One recurring lesson in the weekly timetable. Keyed to a subject (so homework
 * for "Mathe" can find its next lesson). `period` is the Schulstunde (1., 2., …);
 * `startMin`/`endMin` are optional clock times as minutes from midnight.
 */
export const timetableSlots = sqliteTable(
  'timetable_slots',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subjectId: integer('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    /** 1 = Montag … 6 = Samstag. */
    weekday: integer('weekday').notNull(),
    /** The Schulstunde, 1-based. */
    period: integer('period').notNull(),
    /** Optional start/end as minutes from midnight (e.g. 480 = 08:00). */
    startMin: integer('start_min'),
    endMin: integer('end_min'),
    room: text('room'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('timetable_slots_subject_idx').on(t.subjectId)],
);

/**
 * A homework item for a subject. `dueAt` is when it is due — usually computed from
 * the subject's next lesson occurrence, or set manually. `done` survives in the
 * list (struck through) until cleared, so a student can see what they finished.
 */
export const homework = sqliteTable(
  'homework',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subjectId: integer('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    dueAt: integer('due_at', { mode: 'timestamp_ms' }),
    done: integer('done', { mode: 'boolean' }).notNull().default(false),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    note: text('note'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('homework_subject_idx').on(t.subjectId), index('homework_due_idx').on(t.dueAt)],
);

// Relations — enable `db.query.*.findMany({ with: … })` for the live-query hooks.
export const stagesRelations = relations(stages, ({ many }) => ({
  terms: many(terms),
  subjects: many(subjects),
}));

export const termsRelations = relations(terms, ({ one, many }) => ({
  stage: one(stages, { fields: [terms.stageId], references: [stages.id] }),
  grades: many(grades),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  stage: one(stages, { fields: [subjects.stageId], references: [stages.id] }),
  categories: many(gradeCategories),
  grades: many(grades),
  timetableSlots: many(timetableSlots),
  homework: many(homework),
}));

export const timetableSlotsRelations = relations(timetableSlots, ({ one }) => ({
  subject: one(subjects, { fields: [timetableSlots.subjectId], references: [subjects.id] }),
}));

export const homeworkRelations = relations(homework, ({ one }) => ({
  subject: one(subjects, { fields: [homework.subjectId], references: [subjects.id] }),
}));

export const gradeCategoriesRelations = relations(gradeCategories, ({ one, many }) => ({
  subject: one(subjects, { fields: [gradeCategories.subjectId], references: [subjects.id] }),
  grades: many(grades),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  subject: one(subjects, { fields: [grades.subjectId], references: [subjects.id] }),
  category: one(gradeCategories, {
    fields: [grades.categoryId],
    references: [gradeCategories.id],
  }),
  term: one(terms, { fields: [grades.termId], references: [terms.id] }),
}));
