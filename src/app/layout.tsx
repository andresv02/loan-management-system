import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Toaster } from '@/components/ui/toaster';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { solicitudes } from '@/lib/schema';
import { eq, count } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Créditos Nacionales',
  description: 'Sistema de gestión de micropréstamos',
  icons: {
    icon: '/logo.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  
  const pendingCountResult = await db.select({ count: count() })
    .from(solicitudes)
    .where(eq(solicitudes.estado, 'nueva'));
  
  const pendingCount = pendingCountResult[0]?.count || 0;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Navigation pendingCount={pendingCount} />
        <main className="relative">
          <div className="relative z-10">
            {children}
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
