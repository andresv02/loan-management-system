import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import type { UserRole } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const lowerUsername = username.toLowerCase().trim();

    // Debug logging (remove in production)
    console.log('Login attempt:', { username: lowerUsername, password, envPassword: process.env.ADMIN_PASSWORD });

    // Check admin credentials
    if (lowerUsername === 'admin' && password === process.env.ADMIN_PASSWORD) {
      console.log('Admin login successful, creating session');
      await createSession('admin', 'admin');
      return NextResponse.json({ success: true, role: 'admin' });
    }

    // Check analyst credentials
    if (lowerUsername === 'analyst' && password === process.env.ANALYST_PASSWORD) {
      console.log('Analyst login successful, creating session');
      await createSession('analyst', 'analyst');
      return NextResponse.json({ success: true, role: 'analyst' });
    }

    // Invalid credentials
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
