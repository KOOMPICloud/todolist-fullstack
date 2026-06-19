import { createClient, type Client } from '@libsql/client';

/**
 * Turso / libSQL database client.
 *
 * Configure with env vars (injected automatically on KConsole):
 *   DATABASE_URL          e.g. libsql://your-db.turso.io   (or file:./data/dev.db for local)
 *   DATABASE_AUTH_TOKEN   Turso auth token (not needed for local file: URLs)
 *
 * TURSO_DATABASE_URL / TURSO_AUTH_TOKEN are also accepted as aliases.
 */
const DB_URL =
  process.env.DATABASE_URL ||
  process.env.TURSO_DATABASE_URL ||
  'file:./data/dev.db';

const DB_AUTH_TOKEN =
  process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

let clientInstance: Client | null = null;
let schemaReady: Promise<void> | null = null;

function createDbClient(): Client {
  return createClient({
    url: DB_URL,
    authToken: DB_AUTH_TOKEN,
  });
}

async function ensureSchema(client: Client): Promise<void> {
  await client.batch(
    [
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
      `CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed)`,
    ],
    'write'
  );
}

/**
 * Get the shared libSQL client, ensuring the schema exists on first use.
 * Returns null during the production build phase (no DB access at build time).
 */
export async function getDb(): Promise<Client | null> {
  // Skip DB access during the build / export phase.
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export'
  ) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createDbClient();
  }

  if (!schemaReady) {
    schemaReady = ensureSchema(clientInstance).catch((err) => {
      // Reset so a later request can retry schema creation.
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;

  return clientInstance;
}

export default getDb;
