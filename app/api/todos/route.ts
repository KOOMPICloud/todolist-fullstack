import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'nodejs';

// Get current user from request
async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  // Verify token with KID
  try {
    const response = await fetch('https://oauth.koompi.org/v2/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET /api/todos - Get all todos for current user
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user._id || user.sub;

  const stmt = db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC');
  const todos = stmt.all(userId);

  return NextResponse.json({ todos });
}

// POST /api/todos - Create a new todo
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user._id || user.sub;

  try {
    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO todos (id, user_id, title)
      VALUES (?, ?, ?)
    `);

    stmt.run(id, userId, title);

    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}
