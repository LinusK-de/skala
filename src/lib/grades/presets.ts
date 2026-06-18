/**
 * Bundesland-agnostic seed data: school types → scale + grade range, common
 * subject lists, and sane default weights/categories. These are intentionally
 * conservative, widely-true defaults that the user can override per subject —
 * not an attempt to encode 16 states' rules.
 */
import type { CategoryType, Scale } from './types';

export type SchoolType =
  | 'grundschule'
  | 'hauptschule'
  | 'realschule'
  | 'gesamtschule'
  | 'gymnasium_sek1'
  | 'oberstufe'
  | 'berufsschule'
  | 'custom';

export interface SchoolTypePreset {
  type: SchoolType;
  label: string;
  scale: Scale;
  gradeFrom: number;
  gradeTo: number;
  /** A short ready-made name for the stage, e.g. "Realschule". */
  stageName: string;
}

/** Order = the order shown in onboarding. */
export const SCHOOL_TYPES: readonly SchoolTypePreset[] = [
  { type: 'grundschule', label: 'Grundschule', scale: 'grades_1_6', gradeFrom: 1, gradeTo: 4, stageName: 'Grundschule' },
  { type: 'realschule', label: 'Realschule', scale: 'grades_1_6', gradeFrom: 5, gradeTo: 10, stageName: 'Realschule' },
  { type: 'hauptschule', label: 'Haupt-/Mittelschule', scale: 'grades_1_6', gradeFrom: 5, gradeTo: 9, stageName: 'Mittelschule' },
  { type: 'gesamtschule', label: 'Gesamtschule', scale: 'grades_1_6', gradeFrom: 5, gradeTo: 10, stageName: 'Gesamtschule' },
  { type: 'gymnasium_sek1', label: 'Gymnasium (Unter-/Mittelstufe)', scale: 'grades_1_6', gradeFrom: 5, gradeTo: 10, stageName: 'Gymnasium' },
  { type: 'oberstufe', label: 'Gymnasiale Oberstufe', scale: 'points_0_15', gradeFrom: 11, gradeTo: 13, stageName: 'Oberstufe' },
  { type: 'berufsschule', label: 'Berufsschule / FOS', scale: 'grades_1_6', gradeFrom: 11, gradeTo: 13, stageName: 'Berufsschule' },
  { type: 'custom', label: 'Andere', scale: 'grades_1_6', gradeFrom: 5, gradeTo: 12, stageName: 'Schule' },
];

export function schoolTypePreset(type: SchoolType): SchoolTypePreset {
  return SCHOOL_TYPES.find((s) => s.type === type) ?? SCHOOL_TYPES[SCHOOL_TYPES.length - 1];
}

export function schoolTypeToScale(type: SchoolType): Scale {
  return schoolTypePreset(type).scale;
}

const SEK1_SUBJECTS = [
  'Deutsch', 'Mathematik', 'Englisch', 'Biologie', 'Chemie', 'Physik',
  'Geschichte', 'Erdkunde', 'Politik', 'Sport', 'Kunst', 'Musik',
  'Religion', 'Französisch', 'Informatik',
];

const OBERSTUFE_SUBJECTS = [
  'Deutsch', 'Mathematik', 'Englisch', 'Biologie', 'Chemie', 'Physik',
  'Geschichte', 'Geographie', 'Politik & Wirtschaft', 'Sport', 'Kunst',
  'Informatik', 'Französisch',
];

/** A sensible pre-checked subject list for the chosen school type. */
export function defaultSubjectsFor(type: SchoolType): string[] {
  return type === 'oberstufe' ? [...OBERSTUFE_SUBJECTS] : [...SEK1_SUBJECTS];
}

const CORE_SUBJECTS = new Set([
  'deutsch', 'mathematik', 'mathe', 'englisch',
  'französisch', 'latein', 'spanisch',
]);

/** Kernfach? Drives the schriftlich-heavier default weighting. */
export function isCoreSubject(name: string): boolean {
  return CORE_SUBJECTS.has(name.trim().toLowerCase());
}

/** Default schriftlich : mündlich block ratio. Oberstufe defaults to 1:1. */
export function defaultWeights(
  isCore: boolean,
  scale: Scale,
): { writtenWeight: number; oralWeight: number } {
  if (scale === 'points_0_15') return { writtenWeight: 1, oralWeight: 1 };
  return isCore ? { writtenWeight: 2, oralWeight: 1 } : { writtenWeight: 1, oralWeight: 1 };
}

export interface CategorySeed {
  name: string;
  type: CategoryType;
  weight: number;
}

/** The category set seeded when a subject is created. */
export function defaultCategoriesFor(scale: Scale): CategorySeed[] {
  if (scale === 'points_0_15') {
    return [
      { name: 'Klausur', type: 'written', weight: 1 },
      { name: 'Mündlich', type: 'oral', weight: 1 },
    ];
  }
  return [
    { name: 'Klassenarbeit', type: 'written', weight: 1 },
    { name: 'Mündlich', type: 'oral', weight: 1 },
    { name: 'Test', type: 'written', weight: 0.5 },
  ];
}

/** Cycle the theme's muted chart accents for a small per-subject marker. */
const SUBJECT_COLOR_KEYS = ['accent1', 'accent2', 'accent3'] as const;
export function subjectColorKey(index: number): string {
  return SUBJECT_COLOR_KEYS[index % SUBJECT_COLOR_KEYS.length];
}
