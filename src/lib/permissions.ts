export type UserRole = 'admin' | 'analyst';

export interface SessionData {
  user: string;
  role: UserRole;
  expires: string;
}

// Define which routes each role can access
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'], // Admin can access all routes
  analyst: [
    '/',
    '/solicitudes',
    '/prestamos',
    '/payments',
    '/cotizador',
  ],
};

// Routes that are completely blocked for analysts
export const ANALYST_BLOCKED_ROUTES = [
  '/companies',
];

// API routes that analysts can access
export const ANALYST_ALLOWED_API_ROUTES = [
  '/api/login',
  '/api/logout',
  '/api/solicitudes',
  '/api/prestamos',
  '/api/payments',
  '/api/payments/historical',
];

/**
 * Check if a user with the given role has permission to access a route
 */
export function hasPermission(role: UserRole, route: string): boolean {
  // Check blocked routes first
  if (role === 'analyst') {
    // Check exact matches for blocked routes
    if (ANALYST_BLOCKED_ROUTES.includes(route)) {
      return false;
    }
    // Check if route starts with any blocked route
    if (ANALYST_BLOCKED_ROUTES.some(blocked => route.startsWith(blocked + '/'))) {
      return false;
    }
  }

  const allowed = ROLE_PERMISSIONS[role];
  
  // If role doesn't exist, deny access
  if (!allowed) {
    return false;
  }
  
  // Admin has all permissions
  if (allowed.includes('*')) {
    return true;
  }
  
  // Check exact match
  if (allowed.includes(route)) {
    return true;
  }
  
  // Check if route starts with any allowed path (for sub-routes)
  return allowed.some(path => route.startsWith(path + '/'));
}

/**
 * Check if an analyst can access a specific API route
 */
export function canAccessApiRoute(role: UserRole, apiRoute: string): boolean {
  if (role === 'admin') return true;
  
  // Check allowed API routes for analyst
  return ANALYST_ALLOWED_API_ROUTES.some(route => 
    apiRoute === route || apiRoute.startsWith(route + '/')
  );
}

/**
 * Filter navigation items based on user role
 */
export function filterNavItems(role: UserRole, navItems: Array<{ href: string; label: string; icon: string }>) {
  if (role === 'admin') return navItems;
  
  return navItems.filter(item => {
    // Analyst cannot access companies
    if (item.href === '/companies') return false;
    return true;
  });
}
