import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Generic key-value store for user preferences (theme mode, the one-time
 * "pro" unlock flag, a first-launch flag, …). One row per setting. Values are
 * stored as text; callers parse as needed.
 *
 * Every new feature that needs to persist structured data gets its OWN table
 * here — do not overload `settings` with app data. Add the table, then run
 * `npm run db:generate` to create the migration. Never hand-edit generated SQL.
 */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
});
