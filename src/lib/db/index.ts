import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Singleton pattern for the SQL client to prevent connection pool issues
// especially during Next.js HMR/Hot Reloading in development
const globalForSqlClient = globalThis as unknown as {
  sqlClient: postgres.Sql | undefined;
  db: any | undefined;
};

// Use postgres-js which is more portable across runtimes
export const sqlClient =
  globalForSqlClient.sqlClient ??
  postgres(process.env.DATABASE_URL, {
    max: 10,
    idle_timeout: 30,
  });

export const db =
  globalForSqlClient.db ??
  drizzle(sqlClient, {
    schema,
  });

if (process.env.NODE_ENV !== "production") {
  globalForSqlClient.sqlClient = sqlClient;
  globalForSqlClient.db = db;
}
