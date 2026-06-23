import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for database access.");
}

const globalForDb = globalThis as unknown as {
  focusflowPool?: Pool;
};

const pool =
  globalForDb.focusflowPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.focusflowPool = pool;
}

export const db = drizzle(pool, { schema });
