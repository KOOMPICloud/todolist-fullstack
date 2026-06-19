'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddTodoFormProps {
  onAdd: (title: string, file: File | null) => Promise<void>;
}

export function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAdd(title.trim(), file);
      setTitle('');
      resetFile();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to add todo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new todo..."
          disabled={submitting}
        />
        <Button type="submit" disabled={submitting || !title.trim()}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? 'Adding...' : 'Add'}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={submitting}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {file ? file.name : 'Attach image (optional)'}
        </Button>
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={resetFile}
          >
            <X className="size-4" />
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={submitting}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
    </form>
  );
}
