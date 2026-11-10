import { createClient, type Client } from '@libsql/client';

/**
 * Turso / libSQL database client.
 *
 * Configure with env vars (injected automatically on KOOMPI Cloud):
 *   DATABASE_URL          e.g. libsql://your-db.turso.io   (or file:./data/dev.db for local)
 *   DATABASE_AUTH_TOKEN   Turso auth token (not needed for local file: URLs)
 *
 * TURSO_DATABASE_URL / TURSO_AUTH_TOKEN are also accepted as aliases.
 *
 * Keep it fast. The database is a network trip away (about 80 ms a read and
 * 140 ms a write from Singapore), so a request is as fast as the number of
 * trips it makes, not the SQL in them:
 *   - Use getDb(): one shared client. Never call createClient() again (a new
 *     client takes about 0.7 s to connect).
 *   - Reads that don't depend on each other: one db.batch([...], 'read'), one
 *     trip (not Promise.all, where each query is a request of its own).
 *   - Writes that belong together: one db.batch([...], 'write'), one trip, all
 *     or nothing. Not db.transaction(): each of its steps is a trip.
 *   - INSERT / UPDATE / DELETE ... RETURNING * gives back the row it changed:
 *     no SELECT after it.
 *   - Every new WHERE or ORDER BY gets an index in SCHEMA below, e.g.
 *     (user_id, created_at) for "a person's things, newest first".
 *   - Never a query in a loop: one query with IN (...) or a JOIN, or one batch.
 */
const DB_URL =
  process.env.DATABASE_URL ||
  process.env.TURSO_DATABASE_URL ||
  'file:./data/dev.db';

const DB_AUTH_TOKEN =
  process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

// The tables and their indexes, made with CREATE ... IF NOT EXISTS: add a table
// for each kind of thing here, with an index for each WHERE / ORDER BY on it.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    koompi_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    fullname TEXT,
    avatar TEXT,
    wallet_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  // A person's todos, newest first (app/api/todos): found and ordered by the index.
  `CREATE INDEX IF NOT EXISTS idx_todos_user_created ON todos(user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed)`,
  // Orders paid through KOOMPI Cloud (lib/payments.ts): unpaid until the
  // payment event or a payment lookup says it is paid.
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    amount TEXT NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME
  )`,
  // A person's orders, newest first; an order by its payment (app/api/payments).
  `CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id)`,
];

// One client and one schema for the whole process, kept on globalThis: the
// server's files can each have their own copy of this one (instrumentation.ts
// does), and a dev server's hot reload keeps the connection.
const shared = globalThis as typeof globalThis & {
  __koompiDb?: Client;
  __koompiDbSchema?: { statements: string; ready: Promise<void> };
};
const statements = SCHEMA.join(';\n');

/** Make the tables in one trip, once per process (again when SCHEMA changes: a hot reload). */
function ensureSchema(client: Client): Promise<void> {
  if (shared.__koompiDbSchema?.statements !== statements) {
    const ready: Promise<void> = client.batch(SCHEMA, 'write').then(
      () => undefined,
      (err) => {
        // Forget it so a later request can retry schema creation.
        if (shared.__koompiDbSchema?.ready === ready) shared.__koompiDbSchema = undefined;
        throw err;
      }
    );
    shared.__koompiDbSchema = { statements, ready };
  }
  return shared.__koompiDbSchema.ready;
}

/**
 * Get the shared libSQL client, ensuring the schema exists on first use.
 * Returns null during the production build phase (no DB access at build time).
 * instrumentation.ts calls it as the server starts, so the first visitor
 * doesn't wait for the connection and the tables.
 */
export async function getDb(): Promise<Client | null> {
  // Skip DB access during the build / export phase.
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export'
  ) {
    return null;
  }

  const client = (shared.__koompiDb ??= createClient({
    url: DB_URL,
    authToken: DB_AUTH_TOKEN,
  }));

  await ensureSchema(client);

  return client;
}

export default getDb;
