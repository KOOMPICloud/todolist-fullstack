'use client';

import { login } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function LoginCard() {
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
            Todo App
          </CardTitle>
          <p className="text-muted-foreground">Manage your tasks efficiently</p>
        </CardHeader>
        <CardContent>
          <Button onClick={login} size="lg" className="w-full">
            Login with KOOMPI ID
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
