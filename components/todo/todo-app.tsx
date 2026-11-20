'use client';

import { useState } from 'react';
import { ListTodo, Plus } from 'lucide-react';
import { toast } from 'sonner';
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
import { Welcome } from '@/components/welcome';
import { SupportCard } from '@/components/todo/support-card';

/**
 * The main screen (DESIGN.md): a Screen with its title and main action, the
 * feature block (d-spot: what matters now, as one big number), a Segmented
 * switch between two views, the List, its empty state, and a Sheet for the
 * form. The layout's AppShell puts the tabs around it. Signed out it is the
 * welcome page. Adding a to-do still signs in first when the session ended,
 * then adds it (lib/require-sign-in.ts).
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
  const open = todos.todos.filter((t) => t.completed !== 1);
  const done = todos.todos.filter((t) => t.completed === 1);
  const shown = view === 'open' ? open : done;
  const loading = !ready || todos.loading;

  if (ready && !user) return <Welcome />;

  return (
    <Screen title="To-dos" action={<span className="hidden sm:block">{add}</span>}>
      <div className="d-spot">
        <div className="d-spot-value">{loading ? '–' : open.length}</div>
        <p>{loading ? 'Loading your list' : `${open.length === 1 ? 'to-do' : 'to-dos'} left · ${done.length} done`}</p>
      </div>

      <Segmented
        aria-label="Show"
        value={view}
        onChange={setView}
        options={[
          { value: 'open', label: 'Open' },
          { value: 'done', label: 'Done' },
        ]}
      />

      {loading || shown.length > 0 ? (
        <TodoList
          todos={shown}
          loading={loading}
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

      <SupportCard />
      <AddTodoSheet open={adding} onOpenChange={setAdding} onAdd={addTodo} />
      <ImagePreviewDialog src={previewImage} onClose={() => setPreviewImage(null)} />
    </Screen>
  );
}
