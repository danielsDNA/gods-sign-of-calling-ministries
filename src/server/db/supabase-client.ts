import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const createDatabase = (connection: ReturnType<typeof postgres>) => drizzle(connection, { schema });
type Database = ReturnType<typeof createDatabase>;

let connection: ReturnType<typeof postgres> | undefined;
let database: Database | undefined;

function getDatabase(): Database {
  if (database) return database;

  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL is required to connect to the Supabase database');
  }

  connection = postgres(connectionString, {
    max: process.env.VERCEL ? 2 : 5,
    idle_timeout: process.env.VERCEL ? 20 : 0,
    queue_timeout: process.env.VERCEL ? 8 : 0,
    connect_timeout: process.env.VERCEL ? 20 : 30,
    connection: {
      statement_timeout: process.env.VERCEL ? 20_000 : 0,
    },
    prepare: false,
    ssl: 'require',
  });
  database = createDatabase(connection);
  return database;
}

export const db = new Proxy({} as Database, {
  get(_target, property) {
    const instance = getDatabase();
    const value = Reflect.get(instance, property, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export async function closeConnection(): Promise<void> {
  if (connection) await connection.end({ timeout: 5 });
}
