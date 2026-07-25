import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql as dsql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema.js";

const url = process.env.DATABASE_URL ?? "postgres://lotiva:lotiva@localhost:5432/lotiva";

let _sql: ReturnType<typeof postgres> | null = null;
let _db: PostgresJsDatabase<typeof schema> | null = null;

export function getSql() {
  if (!_sql) {
    _sql = postgres(url, { max: 10 });
  }
  return _sql;
}

export type Db = PostgresJsDatabase<typeof schema>;

export function getDb(): Db {
  if (!_db) {
    _db = drizzle(getSql(), { schema });
  }
  return _db;
}

/** Run work inside a transaction with SET LOCAL app.tenant_id for RLS. */
export async function withTenant<T>(tenantId: string, fn: (tx: Db) => Promise<T>): Promise<T> {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(dsql`select set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx as unknown as Db);
  });
}

/** Bypass RLS for bootstrap/seed/migrations / QR resolve. */
export async function withBypassRls<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(dsql`select set_config('app.tenant_id', '', true)`);
    await tx.execute(dsql`SET LOCAL row_security = off`);
    return fn(tx as unknown as Db);
  });
}

export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end({ timeout: 5 });
    _sql = null;
    _db = null;
  }
}
