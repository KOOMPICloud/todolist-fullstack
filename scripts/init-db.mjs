#!/usr/bin/env node
/**
 * Initialize / migrate the Turso (libSQL) schema.
 *
 * Usage:
 *   npm run db:init
 *
 * Reads DATABASE_URL and DATABASE_AUTH_TOKEN from the environment
 * (loads .env.local / .env automatically via Node's --env-file when available).
 */
import { createClient } from '@libsql/client';
import { readFileSync, existsSync } from 'node:fs';

// Minimal .env loader so this works without extra deps.
for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const key = m[1];
    let val = m[2].replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

const url =
  process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || 'file:./data/dev.db';
const authToken =
  process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

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

console.log(`✓ Schema ready on ${url}`);
await client.close();
