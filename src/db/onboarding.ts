/**
 * First-run setup. Both functions write the whole initial career fragment in ONE
 * transaction so the app is never left half-initialised: a stage, its current
 * term, the chosen subjects and each subject's default categories.
 */
import { defaultCategoriesFor, type Scale } from '@/lib/grades';
import { termLabel } from '@/lib/school';

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

export interface OnboardingSubject {
  name: string;
  isCore: boolean;
  writtenWeight: number;
  oralWeight: number;
  colorKey: string;
}

export interface SetupInput {
  stageName: string;
  schoolType: string;
  scale: Scale;
  gradeFrom: number;
  gradeTo: number;
  gradeLevel: number;
  half: number;
  schoolYear: string;
  subjects: OnboardingSubject[];
}

/** Create the very first stage with its current term and the chosen subjects. */
export function setupInitialStage(input: SetupInput): number {
  return db.transaction((tx) => {
    const stage = tx
      .insert(stages)
      .values({
        name: input.stageName,
        schoolType: input.schoolType,
        scale: input.scale,
        gradeFrom: input.gradeFrom,
        gradeTo: input.gradeTo,
        sortOrder: 0,
        startedAt: new Date(),
      })
      .returning({ id: stages.id })
      .get();

    tx.update(terms).set({ isCurrent: false }).run();
    tx.insert(terms)
      .values({
        stageId: stage.id,
        schoolYear: input.schoolYear,
        gradeLevel: input.gradeLevel,
        half: input.half,
        label: termLabel(input.gradeLevel, input.half),
        sortOrder: 0,
        isCurrent: true,
      })
      .run();

    input.subjects.forEach((subject, i) => {
      const subj = tx
        .insert(subjects)
        .values({
          stageId: stage.id,
          name: subject.name,
          isCore: subject.isCore,
          writtenWeight: subject.writtenWeight,
          oralWeight: subject.oralWeight,
          colorKey: subject.colorKey,
          sortOrder: i,
        })
        .returning({ id: subjects.id })
        .get();
      defaultCategoriesFor(input.scale).forEach((seed, ci) => {
        tx.insert(gradeCategories)
          .values({
            subjectId: subj.id,
            name: seed.name,
            type: seed.type,
            weight: seed.weight,
            sortOrder: ci,
          })
          .run();
      });
    });

    return stage.id;
  });
}

interface DemoMark {
  term: 1 | 2;
  value: number;
  tendency: number | null;
  block: 'written' | 'oral';
}

interface DemoSubject {
  name: string;
  isCore: boolean;
  colorKey: string;
  writtenWeight: number;
  oralWeight: number;
  marks: DemoMark[];
}

const DEMO_SUBJECTS: DemoSubject[] = [
  {
    name: 'Mathematik',
    isCore: true,
    colorKey: 'accent1',
    writtenWeight: 2,
    oralWeight: 1,
    marks: [
      { term: 1, value: 3, tendency: 0, block: 'written' },
      { term: 1, value: 2, tendency: 1, block: 'oral' },
      { term: 2, value: 2, tendency: 0, block: 'written' },
      { term: 2, value: 2, tendency: -1, block: 'oral' },
    ],
  },
  {
    name: 'Deutsch',
    isCore: true,
    colorKey: 'accent2',
    writtenWeight: 2,
    oralWeight: 1,
    marks: [
      { term: 1, value: 2, tendency: 1, block: 'written' },
      { term: 1, value: 2, tendency: 0, block: 'oral' },
      { term: 2, value: 2, tendency: 0, block: 'written' },
      { term: 2, value: 1, tendency: 1, block: 'oral' },
    ],
  },
  {
    name: 'Englisch',
    isCore: true,
    colorKey: 'accent3',
    writtenWeight: 2,
    oralWeight: 1,
    marks: [
      { term: 1, value: 1, tendency: 1, block: 'written' },
      { term: 1, value: 2, tendency: -1, block: 'oral' },
      { term: 2, value: 2, tendency: 0, block: 'written' },
      { term: 2, value: 1, tendency: 1, block: 'oral' },
    ],
  },
  {
    name: 'Biologie',
    isCore: false,
    colorKey: 'accent1',
    writtenWeight: 1,
    oralWeight: 1,
    marks: [
      { term: 1, value: 2, tendency: 0, block: 'written' },
      { term: 1, value: 1, tendency: 1, block: 'oral' },
      { term: 2, value: 1, tendency: 1, block: 'written' },
    ],
  },
  {
    name: 'Sport',
    isCore: false,
    colorKey: 'accent2',
    writtenWeight: 1,
    oralWeight: 2,
    marks: [
      { term: 1, value: 1, tendency: 0, block: 'oral' },
      { term: 2, value: 1, tendency: 1, block: 'oral' },
    ],
  },
];

interface DemoSlot {
  name: string;
  weekday: number;
  period: number;
  startMin: number;
  room?: string;
}

/** A small Mo–Fr week so the demo's Stundenplan tab isn't empty. */
const DEMO_SLOTS: DemoSlot[] = [
  { name: 'Mathematik', weekday: 1, period: 1, startMin: 480, room: '204' },
  { name: 'Deutsch', weekday: 1, period: 2, startMin: 530 },
  { name: 'Englisch', weekday: 1, period: 3, startMin: 595 },
  { name: 'Biologie', weekday: 2, period: 1, startMin: 480, room: 'B12' },
  { name: 'Mathematik', weekday: 2, period: 2, startMin: 530, room: '204' },
  { name: 'Sport', weekday: 2, period: 4, startMin: 690, room: 'Halle' },
  { name: 'Deutsch', weekday: 3, period: 1, startMin: 480 },
  { name: 'Englisch', weekday: 3, period: 2, startMin: 530 },
  { name: 'Mathematik', weekday: 4, period: 1, startMin: 480, room: '204' },
  { name: 'Biologie', weekday: 4, period: 2, startMin: 530, room: 'B12' },
  { name: 'Englisch', weekday: 5, period: 1, startMin: 480 },
  { name: 'Sport', weekday: 5, period: 2, startMin: 530, room: 'Halle' },
];

interface DemoHomework {
  name: string;
  title: string;
  dueInDays: number;
  note?: string;
}

/** A few homework items (one overdue, one due tomorrow) so the demo shows the flow. */
const DEMO_HOMEWORK: DemoHomework[] = [
  { name: 'Englisch', title: 'Vocab Unit 6 lernen', dueInDays: -1 },
  { name: 'Deutsch', title: 'Lektüre Kapitel 4 lesen', dueInDays: 1, note: 'für die Diskussion' },
  { name: 'Mathematik', title: 'AB S. 42 Nr. 3–5', dueInDays: 2 },
];

/** Seed a realistic Realschule (Klasse 9) so the app showcases averages and charts. */
export function seedDemoData(): number {
  return db.transaction((tx) => {
    const scale: Scale = 'grades_1_6';
    const stage = tx
      .insert(stages)
      .values({
        name: 'Realschule',
        schoolType: 'realschule',
        scale,
        gradeFrom: 5,
        gradeTo: 10,
        sortOrder: 0,
        startedAt: new Date(),
      })
      .returning({ id: stages.id })
      .get();

    tx.update(terms).set({ isCurrent: false }).run();
    const term1 = tx
      .insert(terms)
      .values({
        stageId: stage.id,
        schoolYear: '2024/25',
        gradeLevel: 9,
        half: 1,
        label: '9/1',
        sortOrder: 0,
        isCurrent: false,
      })
      .returning({ id: terms.id })
      .get();
    const term2 = tx
      .insert(terms)
      .values({
        stageId: stage.id,
        schoolYear: '2024/25',
        gradeLevel: 9,
        half: 2,
        label: '9/2',
        sortOrder: 1,
        isCurrent: true,
      })
      .returning({ id: terms.id })
      .get();
    const termId: Record<1 | 2, number> = { 1: term1.id, 2: term2.id };
    const subjectIdByName: Record<string, number> = {};

    DEMO_SUBJECTS.forEach((demo, si) => {
      const subj = tx
        .insert(subjects)
        .values({
          stageId: stage.id,
          name: demo.name,
          isCore: demo.isCore,
          writtenWeight: demo.writtenWeight,
          oralWeight: demo.oralWeight,
          colorKey: demo.colorKey,
          sortOrder: si,
        })
        .returning({ id: subjects.id })
        .get();
      subjectIdByName[demo.name] = subj.id;

      const catIdByBlock: Partial<Record<'written' | 'oral', number>> = {};
      defaultCategoriesFor(scale).forEach((seed, ci) => {
        const cat = tx
          .insert(gradeCategories)
          .values({
            subjectId: subj.id,
            name: seed.name,
            type: seed.type,
            weight: seed.weight,
            sortOrder: ci,
          })
          .returning({ id: gradeCategories.id })
          .get();
        const block = seed.type === 'written' ? 'written' : 'oral';
        if (catIdByBlock[block] === undefined) catIdByBlock[block] = cat.id;
      });

      demo.marks.forEach((mark, mi) => {
        tx.insert(grades)
          .values({
            subjectId: subj.id,
            categoryId: catIdByBlock[mark.block] ?? null,
            termId: termId[mark.term],
            value: mark.value,
            tendency: mark.tendency,
            weight: 1,
            date: new Date(Date.now() - (si * 7 + mi) * 86_400_000),
            countsTowardAverage: true,
          })
          .run();
      });
    });

    DEMO_SLOTS.forEach((s) => {
      const subjectId = subjectIdByName[s.name];
      if (subjectId === undefined) return;
      tx.insert(timetableSlots)
        .values({
          subjectId,
          weekday: s.weekday,
          period: s.period,
          startMin: s.startMin,
          endMin: s.startMin + 45,
          room: s.room ?? null,
        })
        .run();
    });

    const DAY = 86_400_000;
    DEMO_HOMEWORK.forEach((h) => {
      const subjectId = subjectIdByName[h.name];
      if (subjectId === undefined) return;
      tx.insert(homework)
        .values({
          subjectId,
          title: h.title,
          dueAt: new Date(Date.now() + h.dueInDays * DAY),
          note: h.note ?? null,
        })
        .run();
    });

    return stage.id;
  });
}
