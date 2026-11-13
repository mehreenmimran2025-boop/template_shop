import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { prisma } from './db';

export const SESSION_COOKIE = 'ts_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  uid: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
};

export function secretKey() {
  const secret = process.env.AUTH_SECRET || 'dev-only-insecure-secret-change-me';
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSession(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearSession() {
  cookies().set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

/** Session from the cookie (no DB hit). */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Session validated against the DB — use before anything that grants access. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || user.blocked) return null;
  return user;
}

export async function requireUser(nextPath = '/library') {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'ADMIN') redirect('/');
  return user;
}
