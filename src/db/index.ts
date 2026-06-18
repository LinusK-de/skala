// Public surface of the database layer. UI, hooks and lib import from here only —
// never from `expo-sqlite` or `drizzle-orm` directly. This seam is what lets us
// change storage (or add cloud sync later) without touching screens or logic.
export { db } from './client';
export { useDatabaseMigrations } from './migrator';
export { getSetting, setSetting, deleteSetting } from './queries';
