'use client';

import { useEffect, useState } from 'react';
import { getUser, isAuthenticated, keepSession } from '@/lib/auth';
import type { AuthUser } from '@/lib/types';

/**
 * Reads the current user from localStorage after mount.
 * `ready` flips to true once the (client-only) auth check has run, so callers
 * can avoid rendering auth-dependent UI during SSR / first paint. It also
 * keeps the app's 30-day session fresh (keepSession).
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(getUser());
      void keepSession();
    }
    setReady(true);
  }, []);

  return { user, ready };
}
