import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';
import { hasPermission, canAccessApiRoute, type UserRole } from '@/lib/permissions';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/login', '/api/logout'];

// Static assets that should be ignored
const IGNORED_PATHS = [
  '/_next',
  '/api/webhook',
  '/favicon.ico',
  '/logo.png',
  '/uploads',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for ignored paths
  if (IGNORED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    // Redirect to login if no session
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Decrypt session
  const session = await decrypt(sessionCookie);

  if (!session) {
    // Invalid session, redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if session is expired
  const expires = new Date(session.expires);
  if (expires < new Date()) {
    // Expired session
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = session.role as UserRole;

  // Check API route permissions
  if (pathname.startsWith('/api/')) {
    if (!canAccessApiRoute(role, pathname)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // Check page route permissions
  if (!hasPermission(role, pathname)) {
    // Analyst trying to access restricted page
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
