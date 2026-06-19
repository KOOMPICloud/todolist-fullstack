import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest, userId } from '@/lib/auth-server';

export const runtime = 'nodejs';

// GET /api/todos - Get all todos for the current user
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
  }

  const result = await db.execute({
    sql: 'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId(user)],
  });

  return NextResponse.json({ todos: result.rows });
}

// POST /api/todos - Create a new todo
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, imageUrl } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
    }

    const id = crypto.randomUUID();
    await db.execute({
      sql: 'INSERT INTO todos (id, user_id, title, image_url) VALUES (?, ?, ?, ?)',
      args: [id, userId(user), title, imageUrl || null],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM todos WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ todo: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}
