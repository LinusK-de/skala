import type { Config } from 'drizzle-kit';

// Generates SQLite migrations from src/db/schema.ts into src/db/migrations.
// driver: 'expo' makes drizzle-kit also emit a migrations.js bundle for the device.
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
