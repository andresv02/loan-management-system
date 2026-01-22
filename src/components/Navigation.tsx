'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function Navigation({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/', label: 'Panel', icon: '📊' },
    { href: '/solicitudes', label: 'Solicitudes', icon: '📋' },
    { href: '/prestamos', label: 'Préstamos', icon: '💰' },
    { href: '/payments', label: 'Pagos', icon: '💳' },
    { href: '/companies', label: 'Compañías', icon: '🏢' },
  ];

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <Link href="/" className="flex items-center space-x-3 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Logo de Créditos Nacionales"
            className="w-8 h-8 object-contain rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300"
          />
          <span className="font-bold text-xl text-slate-800 hidden sm:inline-block">
            Créditos Nacionales
          </span>
          <span className="font-bold text-xl text-slate-800 sm:hidden">
            CN
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? 'default' : 'ghost'}
                className={cn(
                  'mr-1 px-4 py-2 rounded-lg transition-all duration-300 relative',
                  pathname === item.href
                    ? 'bg-slate-800 text-white shadow-sm hover:bg-slate-900'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-slate-800'
                )}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
                {item.label === 'Solicitudes' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Button>
            </Link>
          ))}
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Salir
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link 
                    href={item.href} 
                    className={cn(
                      "flex items-center w-full cursor-pointer py-3 px-4",
                      pathname === item.href ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600"
                    )}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.label}
                    {item.label === 'Solicitudes' && pendingCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                        {pendingCount > 9 ? '9+' : pendingCount}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer py-3 px-4"
              >
                <span className="mr-3 text-lg">🚪</span>
                Salir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
