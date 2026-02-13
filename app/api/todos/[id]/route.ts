import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { deleteFile } from '@/lib/storage';

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

// PUT /api/todos/[id] - Update a todo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  const { id } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { completed, title, imageUrl } = body;

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
    }

    // Check if we need to update image
    if (imageUrl !== undefined) {
      // Get current todo to see if there's an old image
      const currentTodo = db.prepare('SELECT image_url FROM todos WHERE id = ?').get(id) as { image_url: string | null };

      if (currentTodo?.image_url && currentTodo.image_url !== imageUrl) {
        // Delete old image if it's being replaced or removed
        console.log(`Deleting old image: ${currentTodo.image_url}`);
        await deleteFile(currentTodo.image_url);
      }
    }

    // Build dynamic update query
    let updates = [];
    let values = [];

    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed ? 1 : 0);
    }

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (imageUrl !== undefined) {
      updates.push('image_url = ?');
      values.push(imageUrl);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id); // For WHERE clause

    if (updates.length > 1) { // > 1 because updated_at is always there
      const stmt = db.prepare(`
        UPDATE todos
        SET ${updates.join(', ')}
        WHERE id = ?
      `);
      stmt.run(...values);
    }

    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);

    return NextResponse.json({ todo });
  } catch (error) {
    console.error('Update todo error:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

// DELETE /api/todos/[id] - Delete a todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  const { id } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
    }

    // Get todo first to check for image
    const todo = db.prepare('SELECT image_url FROM todos WHERE id = ?').get(id) as { image_url: string | null };

    if (todo?.image_url) {
      console.log(`Deleting image for todo ${id}: ${todo.image_url}`);
      await deleteFile(todo.image_url);
    }

    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
    stmt.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
