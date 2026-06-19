import { getToken } from '@/lib/auth';
import type { Todo } from '@/lib/types';

/**
 * Client-side API helpers.
 *
 * All calls run in the browser against the app's own API routes, attaching the
 * KOOMPI access token. Keeping data access on the client keeps the server
 * stateless and the UI fast.
 */

function authHeaders(json = false): HeadersInit {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${getToken()}`,
  };
}

async function parse<T>(res: Response, errorMessage: string): Promise<T> {
  if (!res.ok) {
    throw new Error(errorMessage);
  }
  return res.json() as Promise<T>;
}

export async function listTodos(): Promise<Todo[]> {
  const res = await fetch('/api/todos', { headers: authHeaders() });
  const data = await parse<{ todos: Todo[] }>(res, 'Failed to load todos');
  return data.todos ?? [];
}

export async function createTodo(input: {
  title: string;
  imageUrl?: string | null;
}): Promise<Todo> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(input),
  });
  const data = await parse<{ todo: Todo }>(res, 'Failed to add todo');
  return data.todo;
}

export async function updateTodo(
  id: string,
  updates: Partial<{ title: string; completed: number; imageUrl: string | null }>
): Promise<Todo> {
  const res = await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(updates),
  });
  const data = await parse<{ todo: Todo }>(res, 'Failed to update todo');
  return data.todo;
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await parse(res, 'Failed to delete todo');
}

/**
 * Upload an image via KConsole storage's presigned-URL flow:
 * request token -> PUT to storage -> confirm completion. Returns the object key.
 */
export async function uploadImage(file: File): Promise<string> {
  const tokenRes = await fetch('/api/upload/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });
  const { uploadUrl, key, objectId } = await parse<{
    uploadUrl: string;
    key: string;
    objectId: string;
  }>(tokenRes, 'Failed to get upload token');

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error('Failed to upload file');

  const completeRes = await fetch('/api/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectId }),
  });
  await parse(completeRes, 'Failed to complete upload');

  return key;
}

const STORAGE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL || 'https://storage.koompi.cloud';

/** Build the public URL the browser fetches an uploaded image from. */
export function imageSrc(key?: string | null): string {
  return key ? `${STORAGE_PUBLIC_URL}/${key}` : '';
}
