// Public surface of the database layer. UI, hooks and lib import from here only —
// never from `expo-sqlite` or `drizzle-orm` directly. This seam is what lets us
// change storage (or add cloud sync later) without touching screens or logic.
export { db } from './client';
export { useDatabaseMigrations } from './migrator';
export { getSetting, setSetting, deleteSetting } from './queries';

// Career structure: stages & terms.
export {
  listStages,
  getStage,
  createStage,
  updateStage,
  deleteStage,
  listTerms,
  listAllTerms,
  getCurrentTerm,
  getCurrentStage,
  createTerm,
  setCurrentTerm,
  ensureCurrentTerm,
  deleteTerm,
  type Stage,
  type Term,
  type NewStageInput,
  type NewTermInput,
} from './career';

// Subjects & categories.
export {
  listSubjects,
  getSubject,
  createSubject,
  updateSubject,
  archiveSubject,
  unarchiveSubject,
  deleteSubject,
  reorderSubjects,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Subject,
  type GradeCategory,
  type NewSubjectInput,
} from './subjects';

// Grades.
export {
  listGradesForSubject,
  listGradesForTerm,
  getGrade,
  addGrade,
  updateGrade,
  deleteGrade,
  toGradeInput,
  type Grade,
  type NewGradeInput,
} from './grades';

// First-run setup.
export {
  setupInitialStage,
  seedDemoData,
  type OnboardingSubject,
  type SetupInput,
} from './onboarding';

// Backup / restore.
export { serializeDatabase, restoreDatabase, isBackupData, type BackupData } from './backup';

// Reactive query factories + the useLiveQuery adapter (for hooks).
export {
  useLiveQuery,
  stagesQuery,
  allTermsQuery,
  termsForStageQuery,
  currentTermQuery,
  subjectsQuery,
  allSubjectsForStageQuery,
  subjectQuery,
  categoriesQuery,
  gradesForTermQuery,
  gradesForSubjectQuery,
  allSubjectsQuery,
  allCategoriesQuery,
  allGradesQuery,
} from './live';
