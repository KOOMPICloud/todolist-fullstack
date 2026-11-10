'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface AddTodoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (title: string, file: File | null) => Promise<void>;
}

/** A form in a Sheet: its fields in SheetBody, one main button in SheetFooter. */
export function AddTodoSheet({ open, onOpenChange, onAdd }: AddTodoSheetProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!title.trim()) {
      setError('Write what needs doing.');
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(title.trim(), file);
      setTitle('');
      setError(null);
      resetFile();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Could not add it. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>New to-do</SheetTitle>
            <SheetDescription>Saved to your account, on every device.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <Field label="What needs doing?" error={error}>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Call the landlord about the water bill"
                autoComplete="off"
                disabled={submitting}
              />
            </Field>
            <Field label="Photo" optional hint="A receipt, a shopping list, a picture of what to fix.">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" disabled={submitting} onClick={() => fileInputRef.current?.click()} className="min-w-0 flex-1 justify-start">
                  <ImagePlus />
                  <span className="truncate">{file ? file.name : 'Add a photo'}</span>
                </Button>
                {file && (
                  <Button type="button" variant="ghost" size="icon" onClick={resetFile} aria-label="Remove the photo">
                    <X />
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
            </Field>
          </SheetBody>
          <SheetFooter>
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? 'Adding…' : 'Add to-do'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
