import { Database } from 'bun:sqlite';

/**
 * Full-Stack Todo App Backend
 * Powered by Bun + SQLite
 */

// Configuration
const PORT = parseInt(process.env.PORT || '3001');
const DATABASE_PATH = process.env.DATABASE_PATH || '/data/db/app.db';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize SQLite database
const db = new Database(DATABASE_PATH);

// Enable WAL mode for better concurrent access
db.exec('PRAGMA journal_mode=WAL');
db.exec('PRAGMA synchronous=NORMAL');

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

/**
 * Verify OAuth token and get user info
 */
async function verifyToken(token: string) {
  try {
    // In production, verify with KID
    // For now, we'll decode and extract user info
    const response = await fetch('https://oauth.koompi.org/v2/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Invalid token');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Unauthorized');
  }
}

/**
 * Upsert user from OAuth
 */
function upsertUser(user: any) {
  const stmt = db.prepare(`
    INSERT INTO users (koompi_id, email, fullname, avatar, wallet_address)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(koompi_id) DO UPDATE SET
      email = excluded.email,
      fullname = excluded.fullname,
      avatar = excluded.avatar,
      wallet_address = excluded.wallet_address,
      updated_at = CURRENT_TIMESTAMP
  `);

  return stmt.run(user._id || user.sub, user.email, user.fullname, user.avatar, user.wallet_address);
}

/**
 * Generate UUID
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Start server
 */
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (path === '/api/health' && method === 'GET') {
      return Response.json({
        status: 'ok',
        database: 'connected',
        node: NODE_ENV
      }, { headers: corsHeaders });
    }

    // Get current user
    if (path === '/api/me' && method === 'GET') {
      try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.split(' ')[1];
        const user = await verifyToken(token);
        upsertUser(user);

        return Response.json({ user }, { headers: corsHeaders });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get todos
    if (path === '/api/todos' && method === 'GET') {
      try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.split(' ')[1];
        const user = await verifyToken(token);
        const userId = user._id || user.sub;

        const stmt = db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC');
        const todos = stmt.all(userId);

        return Response.json({ todos }, { headers: corsHeaders });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Create todo
    if (path === '/api/todos' && method === 'POST') {
      try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.split(' ')[1];
        const user = await verifyToken(token);
        const userId = user._id || user.sub;

        const body = await req.json();
        const { title } = body;

        if (!title) {
          return new Response(JSON.stringify({ error: 'Title is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const id = generateId();
        const stmt = db.prepare(`
          INSERT INTO todos (id, user_id, title)
          VALUES (?, ?, ?)
        `);

        stmt.run(id, userId, title);

        const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);

        return Response.json({ todo }, { headers: corsHeaders });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Update todo
    if (path.startsWith('/api/todos/') && method === 'PUT') {
      try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.split(' ')[1];
        await verifyToken(token);

        const id = path.split('/').pop();
        const body = await req.json();
        const { completed } = body;

        if (typeof completed !== 'boolean') {
          return new Response(JSON.stringify({ error: 'Completed is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const stmt = db.prepare(`
          UPDATE todos
          SET completed = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        stmt.run(completed ? 1 : 0, id);

        const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);

        return Response.json({ todo }, { headers: corsHeaders });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Delete todo
    if (path.startsWith('/api/todos/') && method === 'DELETE') {
      try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.split(' ')[1];
        await verifyToken(token);

        const id = path.split('/').pop();

        const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
        stmt.run(id);

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 404
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },
});

console.log(`🚀 Server running on http://localhost:${PORT}`);
console.log(`📁 Database: ${DATABASE_PATH}`);
console.log(`🌍 Environment: ${NODE_ENV}`);
