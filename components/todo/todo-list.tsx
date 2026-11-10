'use client';

import type { Todo } from '@/lib/types';
import { List, ListSkeleton } from '@/components/ui/list';
import { TodoItem } from '@/components/todo/todo-item';

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onRemoveImage: (id: string) => void;
  onReplaceImage: (id: string, file: File) => void;
  onDelete: (id: string) => void;
  onPreview: (src: string) => void;
}

export function TodoList({
  todos,
  loading,
  onToggle,
  onRemoveImage,
  onReplaceImage,
  onDelete,
  onPreview,
}: TodoListProps) {
  // Loading: rows of the real rows' shape, never a blank screen.
  if (loading) return <ListSkeleton />;

  return (
    <List>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onRemoveImage={onRemoveImage}
          onReplaceImage={onReplaceImage}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      ))}
    </List>
  );
}
