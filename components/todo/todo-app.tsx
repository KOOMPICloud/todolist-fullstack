'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/auth';
import { useAuth } from '@/hooks/use-auth';
import { useTodos } from '@/hooks/use-todos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AddTodoForm } from '@/components/todo/add-todo-form';
import { TodoList } from '@/components/todo/todo-list';
import { LoginCard } from '@/components/todo/login-card';
import { ImagePreviewDialog } from '@/components/todo/image-preview-dialog';

export function TodoApp() {
  const { user, ready } = useAuth();
  const todos = useTodos(!!user);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Wait for the client-only auth check before deciding which view to show.
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center p-5">
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  if (!user) {
    return <LoginCard />;
  }

  return (
    <div className="flex min-h-screen items-start justify-center p-5">
      <Card className="mt-8 w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="text-2xl font-bold">My Todos</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user.fullname || user.email}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <AddTodoForm onAdd={todos.add} />
          <TodoList
            todos={todos.todos}
            loading={todos.loading}
            onToggle={todos.toggle}
            onRemoveImage={todos.removeImage}
            onReplaceImage={todos.replaceImage}
            onDelete={todos.remove}
            onPreview={setPreviewImage}
          />
        </CardContent>
      </Card>

      <ImagePreviewDialog
        src={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
