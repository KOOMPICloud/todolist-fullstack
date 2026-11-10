'use client';

import { useRef, useState } from 'react';
import { ImageMinus, RefreshCw, Trash2 } from 'lucide-react';
import { imageSrc } from '@/lib/api';
import { formatDay } from '@/lib/format';
import type { Todo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ListRow } from '@/components/ui/list';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onRemoveImage: (id: string) => void;
  onReplaceImage: (id: string, file: File) => void;
  onDelete: (id: string) => void;
  onPreview: (src: string) => void;
}

const when = (day: string) => (['Today', 'Yesterday', 'Tomorrow'].includes(day) ? day.toLowerCase() : day);

/** A row (ListRow): tick it in place; tap it for its details and actions in a Sheet. */
export function TodoItem({
  todo,
  onToggle,
  onRemoveImage,
  onReplaceImage,
  onDelete,
  onPreview,
}: TodoItemProps) {
  const completed = todo.completed === 1;
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const image = todo.image_url ? imageSrc(todo.image_url) : null;

  return (
    <>
      <ListRow
        leading={
          <Checkbox
            checked={completed}
            onCheckedChange={(checked) => onToggle(todo.id, checked === true)}
            aria-label={completed ? `Mark "${todo.title}" as not done` : `Mark "${todo.title}" as done`}
          />
        }
        title={<span className={completed ? 'text-muted-foreground line-through' : undefined}>{todo.title}</span>}
        description={`Added ${when(formatDay(todo.created_at))}`}
        trailing={
          image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" loading="lazy" className="size-11 rounded-lg object-cover" />
          ) : undefined
        }
        onClick={() => {
          setConfirming(false);
          setOpen(true);
        }}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="break-words">{todo.title}</SheetTitle>
            <SheetDescription>
              {completed ? 'Done' : 'Open'} · added {when(formatDay(todo.created_at))}
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            {image && (
              <button type="button" className="cursor-zoom-in overflow-hidden rounded-xl border" onClick={() => onPreview(image)}>
                {/* Served straight from object storage (unoptimized). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="The to-do's photo" className="max-h-72 w-full object-cover" />
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <RefreshCw />
                {image ? 'New photo' : 'Add photo'}
              </Button>
              <Button variant="secondary" disabled={!image} onClick={() => onRemoveImage(todo.id)}>
                <ImageMinus />
                Remove photo
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onReplaceImage(todo.id, file);
                e.target.value = '';
              }}
            />
          </SheetBody>
          <SheetFooter>
            {/* Deleting asks once more, on the same button. */}
            <Button
              variant="destructive"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                if (!confirming) return setConfirming(true);
                setOpen(false);
                onDelete(todo.id);
              }}
            >
              <Trash2 />
              {confirming ? 'Tap again to delete' : 'Delete to-do'}
            </Button>
            <Button size="lg" className="w-full sm:w-auto" onClick={() => { onToggle(todo.id, !completed); setOpen(false); }}>
              {completed ? 'Mark as not done' : 'Mark as done'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
