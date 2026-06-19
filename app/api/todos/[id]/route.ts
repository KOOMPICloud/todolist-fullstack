import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { deleteFile } from '@/lib/storage';
import { getUserFromRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';

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

    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
    }

    // Check if we need to update image
    if (imageUrl !== undefined) {
      // Get current todo to see if there's an old image
      const current = await db.execute({
        sql: 'SELECT image_url FROM todos WHERE id = ?',
        args: [id],
      });
      const currentImage = current.rows[0]?.image_url as string | null | undefined;

      if (currentImage && currentImage !== imageUrl) {
        // Delete old image if it's being replaced or removed
        console.log(`Deleting old image: ${currentImage}`);
        await deleteFile(currentImage);
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

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
      await db.execute({
        sql: `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`,
        args: values,
      });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM todos WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ todo: result.rows[0] });
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
    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
    }

    // Get todo first to check for image
    const current = await db.execute({
      sql: 'SELECT image_url FROM todos WHERE id = ?',
      args: [id],
    });
    const imageUrl = current.rows[0]?.image_url as string | null | undefined;

    if (imageUrl) {
      console.log(`Deleting image for todo ${id}: ${imageUrl}`);
      await deleteFile(imageUrl);
    }

    await db.execute({
      sql: 'DELETE FROM todos WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
