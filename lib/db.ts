import Database from 'better-sqlite3';
import path from 'path';

// Database path - uses persistent volume
const DB_PATH = process.env.DATABASE_PATH || '/data/db/app.db';

// Ensure database directory exists
const DB_DIR = path.dirname(DB_PATH);
if (!require('fs').existsSync(DB_DIR)) {
  require('fs').mkdirSync(DB_DIR, { recursive: true });
}

// Initialize SQLite database
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Initialize tables
function initDatabase() {
  // Users table (for KConsole OAuth)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      koompi_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      fullname TEXT,
      avatar TEXT,
      wallet_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Todos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(koompi_id) ON DELETE CASCADE
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
    CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
  `);

  console.log('Database initialized');
}

initDatabase();

export default db;
