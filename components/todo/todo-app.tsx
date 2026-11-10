'use client';

import { useState } from 'react';
import { ListTodo, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTodos } from '@/hooks/use-todos';
import { Screen } from '@/components/ui/app-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Segmented } from '@/components/ui/segmented';
import { AddTodoSheet } from '@/components/todo/add-todo-form';
import { TodoList } from '@/components/todo/todo-list';
import { LoginCard } from '@/components/todo/login-card';
import { ImagePreviewDialog } from '@/components/todo/image-preview-dialog';
import { SupportCard } from '@/components/todo/support-card';

/**
 * The main screen (DESIGN.md): a Screen with its title and main action, a
 * Segmented switch between two views, the List, its empty state, and a Sheet
 * for the form. The layout's AppShell puts the tabs around it.
 */
export function TodoApp() {
  const { user, ready } = useAuth();
  const todos = useTodos(!!user);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<'open' | 'done'>('open');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (ready && !user) return <LoginCard />;

  const open = todos.todos.filter((t) => t.completed !== 1);
  const done = todos.todos.filter((t) => t.completed === 1);
  const shown = view === 'open' ? open : done;
  const add = (
    <Button onClick={() => setAdding(true)} disabled={!ready}>
      <Plus />
      New to-do
    </Button>
  );

  return (
    <Screen
      title="To-dos"
      description={ready && !todos.loading ? `${open.length} open · ${done.length} done` : ' '}
      action={<span className="hidden sm:block">{add}</span>}
    >
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

      {user && <SupportCard />}

      <AddTodoSheet open={adding} onOpenChange={setAdding} onAdd={todos.add} />
      <ImagePreviewDialog src={previewImage} onClose={() => setPreviewImage(null)} />
    </Screen>
  );
}
