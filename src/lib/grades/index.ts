// Public surface of the grade-math layer. Hooks and components import from here.
export * from './types';
export { tendencyToDecimal, decimalToGradeLabel } from './tendency';
export { pointsToGrade, gradeToPoints } from './points';
export { scaleSpec, toAveragingValue, isBetter, gradeLabel, type ScaleSpec } from './scale';
export { sentimentFor, type Sentiment } from './sentiment';
export {
  weightedAverage,
  meanOf,
  subjectAverage,
  termAverage,
  yearAverage,
  stageAverage,
} from './average';
export { requiredNextGrade } from './forecast';
export { normalizeToDecimal, normalizeAverageToDecimal } from './normalize';
export { roundForDisplay, formatDecimal, probableReportGrade, formatNativeAverage } from './round';
export {
  SCHOOL_TYPES,
  schoolTypePreset,
  schoolTypeToScale,
  defaultSubjectsFor,
  isCoreSubject,
  defaultWeights,
  defaultCategoriesFor,
  subjectColorKey,
  type SchoolType,
  type SchoolTypePreset,
  type CategorySeed,
} from './presets';
