import type { Metadata } from 'next';
import { ListTodo, UserRound } from 'lucide-react';
import './globals.css';
import { themeScript } from './theme-script';
import { AppShell, type NavItem } from '@/components/ui/app-shell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Daily',
  description: 'Your to-dos, saved to your KOOMPI ID, on your phone and your computer.',
};

// The app's main places, 2 to 5: a tab bar on phones, a side bar on wide screens (DESIGN.md).
const nav: NavItem[] = [
  { href: '/', label: 'To-dos', icon: <ListTodo /> },
  { href: '/account', label: 'Account', icon: <UserRound /> },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <AppShell brand="Daily" nav={nav} actions={<ThemeToggle />}>
          {children}
        </AppShell>
        <Toaster />
      </body>
    </html>
  );
}
