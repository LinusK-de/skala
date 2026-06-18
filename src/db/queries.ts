import { eq } from 'drizzle-orm';

import { db } from './client';
import { settings } from './schema';

/**
 * Read a single setting value, or null if it has never been written.
 * The ONLY place this app touches the database for settings.
 */
export async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

/** Insert or update a setting. */
export async function setSetting(key: string, value: string): Promise<void> {
  const now = new Date();
  await db
    .insert(settings)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: now } });
}

/** Remove a setting entirely. */
export async function deleteSetting(key: string): Promise<void> {
  await db.delete(settings).where(eq(settings.key, key));
}
