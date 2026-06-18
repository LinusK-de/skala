import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

// The on-device SQLite file. `scripts/init-app.mjs` renames it per app.
// enableChangeListener lets live queries react to writes.
const sqlite = openDatabaseSync('skala.db', { enableChangeListener: true });

/**
 * The single Drizzle database instance.
 * Do not import this from UI or lib — go through the helpers exported by `@/db`.
 */
export const db = drizzle(sqlite, { schema });
