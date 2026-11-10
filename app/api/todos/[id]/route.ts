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

    if (updates.length === 0) {
      // Nothing to change: the todo as it is.
      const result = await db.execute({ sql: 'SELECT * FROM todos WHERE id = ?', args: [id] });
      return NextResponse.json({ todo: result.rows[0] });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    // RETURNING * gives back the changed row in the same trip: no SELECT after it.
    const update = {
      sql: `UPDATE todos SET ${updates.join(', ')} WHERE id = ? RETURNING *`,
      args: [...values, id],
    };

    if (imageUrl === undefined) {
      const result = await db.execute(update);
      return NextResponse.json({ todo: result.rows[0] });
    }

    // A new or no image: the image it had and the change, in one trip (one
    // transaction, in order, so the SELECT sees the old image).
    const [before, result] = await db.batch(
      [{ sql: 'SELECT image_url FROM todos WHERE id = ?', args: [id] }, update],
      'write'
    );
    const currentImage = before.rows[0]?.image_url as string | null | undefined;

    if (currentImage && currentImage !== imageUrl) {
      // Delete old image now that it is replaced or removed
      console.log(`Deleting old image: ${currentImage}`);
      await deleteFile(currentImage);
    }

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

    // RETURNING gives back the deleted row's image in the same trip.
    const result = await db.execute({
      sql: 'DELETE FROM todos WHERE id = ? RETURNING image_url',
      args: [id],
    });
    const imageUrl = result.rows[0]?.image_url as string | null | undefined;

    if (imageUrl) {
      console.log(`Deleting image for todo ${id}: ${imageUrl}`);
      await deleteFile(imageUrl);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
