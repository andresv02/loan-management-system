import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { UserRole, SessionData } from './permissions';

const secretKey = process.env.AUTH_SECRET || 'default_secret_key_change_me';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionData) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return {
      user: payload.user as string,
      role: payload.role as UserRole,
      expires: payload.expires as string,
    };
  } catch (error) {
    return null;
  }
}

export async function createSession(user: string, role: UserRole) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const sessionData: SessionData = { 
    user, 
    role, 
    expires: expires.toISOString() 
  };
  
  const session = await encrypt(sessionData);

  cookies().set('session', session, { 
    expires, 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  cookies().set('session', '', { 
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export async function getSession(): Promise<SessionData | null> {
  const session = cookies().get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}
