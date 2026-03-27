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
import type { UserRole } from '@/lib/permissions';

interface NavigationProps {
  pendingCount?: number;
  userRole?: UserRole;
}

export function Navigation({ pendingCount = 0, userRole = 'admin' }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const allNavItems = [
    { href: '/', label: 'Panel', icon: '📊' },
    { href: '/solicitudes', label: 'Solicitudes', icon: '📋' },
    { href: '/prestamos', label: 'Préstamos', icon: '💰' },
    { href: '/payments', label: 'Pagos', icon: '💳' },
    { href: '/companies', label: 'Compañías', icon: '🏢' },
    { href: '/cotizador', label: 'Cotizador', icon: '🧮' },
  ];

  // Filter nav items based on role
  // Analyst: Solo Solicitudes, Prestamos, Cotizador (NO Pagos, NO Panel, NO Compañías)
  const navItems = userRole === 'analyst' 
    ? allNavItems.filter(item => 
        item.href === '/solicitudes' || 
        item.href === '/prestamos' || 
        item.href === '/cotizador'
      )
    : allNavItems;

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
          
          {/* User Role Badge */}
          <div className="flex items-center space-x-2 ml-2">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              userRole === 'admin' 
                ? "bg-purple-100 text-purple-700" 
                : "bg-blue-100 text-blue-700"
            )}>
              {userRole === 'admin' ? 'Admin' : 'Analista'}
            </span>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Salir
            </Button>
          </div>
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
              {/* User Info */}
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">
                  {userRole === 'admin' ? 'Administrador' : 'Analista'}
                </p>
              </div>
              
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
