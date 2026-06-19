'use client';

import { RefreshCw, Trash2, X } from 'lucide-react';
import { imageSrc } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Todo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onRemoveImage: (id: string) => void;
  onReplaceImage: (id: string, file: File) => void;
  onDelete: (id: string) => void;
  onPreview: (src: string) => void;
}

export function TodoItem({
  todo,
  onToggle,
  onRemoveImage,
  onReplaceImage,
  onDelete,
  onPreview,
}: TodoItemProps) {
  const completed = todo.completed === 1;

  return (
    <li className="rounded-lg border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <Checkbox
            checked={completed}
            onCheckedChange={(checked) => onToggle(todo.id, checked === true)}
          />
          <span
            className={cn(
              'text-base',
              completed && 'text-muted-foreground line-through'
            )}
          >
            {todo.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {todo.image_url && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="Remove image"
              onClick={() => onRemoveImage(todo.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Replace image"
            asChild
          >
            <label className="cursor-pointer">
              <RefreshCw className="size-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onReplaceImage(todo.id, file);
                  e.target.value = '';
                }}
              />
            </label>
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="size-8"
            title="Delete todo"
            onClick={() => onDelete(todo.id)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {todo.image_url && (
        <button
          type="button"
          className="mt-3 block w-full overflow-hidden rounded-lg"
          onClick={() => onPreview(imageSrc(todo.image_url))}
        >
          {/* Image is served straight from object storage (unoptimized). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc(todo.image_url)}
            alt="Todo attachment"
            loading="lazy"
            className="max-h-72 w-full object-contain"
          />
        </button>
      )}
    </li>
  );
}
