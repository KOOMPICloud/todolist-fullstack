'use client';

import { ListTodo } from 'lucide-react';
import { login } from '@/lib/auth';
import { Screen } from '@/components/ui/app-shell';
import { Button } from '@/components/ui/button';

/** The welcome for someone who isn't signed in: what the app does for them, and one way in. */
export function LoginCard() {
  return (
    <Screen width="form" className="pt-4 lg:pt-12">
      <div className="flex flex-col items-center gap-5 rounded-2xl border bg-card px-6 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary-ink">
          <ListTodo className="size-7" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-title">Your to-dos, everywhere</h1>
          <p className="text-muted-foreground">Write down what needs doing and tick it off, on your phone and your computer.</p>
        </div>
        <Button onClick={login} size="lg" className="w-full">
          Sign in with KOOMPI ID
        </Button>
        <p className="text-[13px] text-muted-foreground">No new password: your KOOMPI ID keeps your list.</p>
      </div>
    </Screen>
  );
}
