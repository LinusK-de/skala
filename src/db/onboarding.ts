/**
 * First-run setup. Both functions write the whole initial career fragment in ONE
 * transaction so the app is never left half-initialised: a stage, its current
 * term, the chosen subjects and each subject's default categories.
 */
import { defaultCategoriesFor, type Scale } from '@/lib/grades';
import { termLabel } from '@/lib/school';

import { db } from './client';
import { gradeCategories, grades, stages, subjects, terms } from './schema';

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

    return stage.id;
  });
}
