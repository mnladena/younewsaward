import 'server-only';
import { Pool, type QueryResultRow } from 'pg';

export type Status = 'pending' | 'approved' | 'rejected';
export type Greeting = { id: number; name: string | null; team: string | null; message: string; status: Status; created_at: Date };
export type Video = { id: number; url: string; title: string; sender_name: string | null; sender_role: string | null; poster: string | null; created_at: Date };

// One pool per server instance; Neon's pooled endpoint (PgBouncer) does the real pooling.
const globalForDb = globalThis as unknown as { pool?: Pool; schema?: Promise<unknown> };
const pool = (globalForDb.pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }));

// Advisory lock: parallel build workers would otherwise race on CREATE TABLE IF NOT EXISTS.
const SCHEMA = `
  BEGIN;
  SELECT pg_advisory_xact_lock(20261027);
  CREATE TABLE IF NOT EXISTS greetings (
    id SERIAL PRIMARY KEY,
    name TEXT,
    team TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    sender_name TEXT,
    sender_role TEXT,
    poster TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  COMMIT;`;

// ponytail: schema is created lazily on first query; switch to real migrations once it starts changing.
export async function sql<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (see .env.example)');
  await (globalForDb.schema ??= pool.query(SCHEMA).catch((err) => { globalForDb.schema = undefined; throw err; }));
  return (await pool.query<T>(text, params)).rows;
}
