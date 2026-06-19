'use client';

import type { Todo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
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
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No todos yet. Add one above!
      </div>
    );
  }

  return (
    <ul className="space-y-2">
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
    </ul>
  );
}
