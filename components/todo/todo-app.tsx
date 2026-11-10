'use client';

import { useState } from 'react';
import { ListTodo, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { login } from '@/lib/auth';
import { requireSignIn, useResumeAfterSignIn } from '@/lib/require-sign-in';
import { useAuth } from '@/hooks/use-auth';
import { useTodos } from '@/hooks/use-todos';
import { Screen } from '@/components/ui/app-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Segmented } from '@/components/ui/segmented';
import { AddTodoSheet } from '@/components/todo/add-todo-form';
import { TodoList } from '@/components/todo/todo-list';
import { ImagePreviewDialog } from '@/components/todo/image-preview-dialog';
import { SupportCard } from '@/components/todo/support-card';

/**
 * The main screen (DESIGN.md): a Screen with its title and main action, a
 * Segmented switch between two views, the List, its empty state, and a Sheet
 * for the form. The layout's AppShell puts the tabs around it. Signed out it
 * is the same screen, empty, and its buttons work: adding a to-do signs in
 * first, then adds it (lib/require-sign-in.ts).
 */
export function TodoApp() {
  const { user, ready } = useAuth();
  const todos = useTodos(!!user);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<'open' | 'done'>('open');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Adding needs an account: signed out, it signs in, and the to-do (with its photo) is added once back.
  const addTodo = async (title: string, photo: File | null) => {
    if (!requireSignIn('add-todo', { title, photo })) return false;
    await todos.add(title, photo);
    return true;
  };
  useResumeAfterSignIn<{ title: string; photo: File | null }>(
    'add-todo',
    ({ title, photo }) => addTodo(title, photo).catch((error) => toast.error(error instanceof Error ? error.message : 'Could not add it. Try again.')),
    todos.loaded,
  );

  const add = (
    <Button onClick={() => setAdding(true)} disabled={!ready}>
      <Plus />
      New to-do
    </Button>
  );
  const signedOut = ready && !user;
  const open = todos.todos.filter((t) => t.completed !== 1);
  const done = todos.todos.filter((t) => t.completed === 1);
  const shown = view === 'open' ? open : done;

  return (
    <Screen
      title="To-dos"
      description={signedOut ? 'Saved to your KOOMPI ID, on every device' : ready && !todos.loading ? `${open.length} open · ${done.length} done` : ' '}
      action={signedOut ? undefined : <span className="hidden sm:block">{add}</span>}
    >
      {signedOut ? (
        // Signed out: the same screen, its buttons working (they sign in themselves), never "please sign in".
        <EmptyState
          icon={<ListTodo />}
          title="Your to-dos, everywhere"
          description="Write down what needs doing and tick it off, on your phone and your computer."
          action={
            <div className="flex flex-col items-center gap-2">
              {add}
              <Button variant="ghost" onClick={login}>Sign in with KOOMPI ID</Button>
            </div>
          }
        />
      ) : (
        <>
          <Segmented
            aria-label="Show"
            value={view}
            onChange={setView}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'done', label: 'Done' },
            ]}
          />

          {!ready || todos.loading || shown.length > 0 ? (
            <TodoList
              todos={shown}
              loading={!ready || todos.loading}
              onToggle={todos.toggle}
              onRemoveImage={todos.removeImage}
              onReplaceImage={todos.replaceImage}
              onDelete={todos.remove}
              onPreview={setPreviewImage}
            />
          ) : (
            <EmptyState
              icon={<ListTodo />}
              title={view === 'open' ? 'Nothing to do' : 'Nothing done yet'}
              description={view === 'open' ? 'Add what you need to remember. It is saved to your account.' : 'Tick a to-do and it moves here.'}
              action={view === 'open' ? add : undefined}
            />
          )}

          {/* On a phone the main action sits under the thumb, above the tab bar. */}
          {open.length > 0 && view === 'open' && <div className="sm:hidden [&>button]:w-full">{add}</div>}
        </>
      )}

      <SupportCard />
      <AddTodoSheet open={adding} onOpenChange={setAdding} onAdd={addTodo} />
      <ImagePreviewDialog src={previewImage} onClose={() => setPreviewImage(null)} />
    </Screen>
  );
}
