import { defineConfig } from 'drizzle-kit';

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('Set SUPABASE_DB_URL before running Drizzle Kit.');
}

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: false,
});
