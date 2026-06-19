'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import * as api from '@/lib/api';
import type { Todo } from '@/lib/types';

/**
 * Owns the todo list state and all mutations. Updates are optimistic-friendly:
 * the server response replaces local state so the UI stays in sync.
 */
export function useTodos(enabled: boolean) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTodos(await api.listTodos());
    } catch (error) {
      console.error(error);
      toast.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load todos once the user is authenticated (client-side fetch on mount).
  useEffect(() => {
    if (enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refresh();
    } else {
      setLoading(false);
    }
  }, [enabled, refresh]);

  const add = useCallback(
    async (title: string, file: File | null) => {
      let imageUrl: string | null = null;
      if (file) {
        imageUrl = await api.uploadImage(file);
      }
      const todo = await api.createTodo({ title, imageUrl });
      setTodos((prev) => [todo, ...prev]);
      toast.success('Todo added');
    },
    []
  );

  const toggle = useCallback(async (id: string, completed: boolean) => {
    try {
      const todo = await api.updateTodo(id, { completed: completed ? 1 : 0 });
      setTodos((prev) => prev.map((t) => (t.id === id ? todo : t)));
    } catch (error) {
      console.error(error);
      toast.error('Failed to update todo');
    }
  }, []);

  const removeImage = useCallback(async (id: string) => {
    try {
      const todo = await api.updateTodo(id, { imageUrl: null });
      setTodos((prev) => prev.map((t) => (t.id === id ? todo : t)));
      toast.success('Image removed');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove image');
    }
  }, []);

  const replaceImage = useCallback(async (id: string, file: File) => {
    try {
      const key = await api.uploadImage(file);
      const todo = await api.updateTodo(id, { imageUrl: key });
      setTodos((prev) => prev.map((t) => (t.id === id ? todo : t)));
      toast.success('Image updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update image');
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await api.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      toast.success('Todo deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete todo');
    }
  }, []);

  return {
    todos,
    loading,
    refresh,
    add,
    toggle,
    removeImage,
    replaceImage,
    remove,
  };
}
