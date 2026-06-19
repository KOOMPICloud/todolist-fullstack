import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Todo App - KConsole Template',
  description: 'Full-stack todo application with KConsole Provider OAuth',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
