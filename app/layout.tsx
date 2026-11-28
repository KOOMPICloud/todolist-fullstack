import type { Metadata, Viewport } from 'next';
import { ListTodo, UserRound } from 'lucide-react';
import './globals.css';
import { themeScript } from './theme-script';
import { brand } from './brand';
import { AppShell, type NavItem } from '@/components/ui/app-shell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Toaster } from '@/components/ui/sonner';
import { TelegramFrame } from '@/components/telegram';
import { telegramScript } from '@/lib/telegram';

export const metadata: Metadata = {
  title: 'Daily',
  description: 'Your to-dos, saved to your KOOMPI ID, on your phone and your computer.',
};

// viewportFit cover: the page runs under the notch and the home bar, and var(--safe-top) / var(--safe-bottom) keep its bars clear.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: brand.bg,
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
        <script dangerouslySetInnerHTML={{ __html: telegramScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <AppShell brand="Daily" nav={nav} actions={<ThemeToggle />}>
          {children}
        </AppShell>
        <Toaster />
        <TelegramFrame />
      </body>
    </html>
  );
}
