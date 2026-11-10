'use client';

import { LogOut, Moon } from 'lucide-react';
import { logout } from '@/lib/auth';
import { useAuth } from '@/hooks/use-auth';
import { Screen, Section } from '@/components/ui/app-shell';
import { Avatar } from '@/components/ui/avatar';
import { List, ListRow } from '@/components/ui/list';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LoginCard } from '@/components/todo/login-card';

/** The Account tab: who is signed in, the light/dark switch, signing out. */
export function AccountScreen() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <Screen title="Account">
        <Skeleton className="h-16 rounded-2xl" />
      </Screen>
    );
  }
  if (!user) return <LoginCard />;

  const name = user.fullname || user.name || user.email || 'You';

  return (
    <Screen title="Account">
      <List>
        <ListRow leading={<Avatar name={name} src={user.picture || user.avatar} />} title={name} description={user.email ?? 'Signed in with KOOMPI ID'} />
      </List>
      <Section title="Settings">
        <List>
          <ListRow icon={<Moon />} title="Appearance" description="Light or dark" trailing={<ThemeToggle />} />
          <ListRow icon={<LogOut />} title="Sign out" description="You can sign in again with your KOOMPI ID" onClick={logout} />
        </List>
      </Section>
    </Screen>
  );
}
