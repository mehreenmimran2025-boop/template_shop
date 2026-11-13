import { NextResponse } from 'next/server';
import { getCurrentUser } from './auth';

/** Returns the admin user, or a ready-to-return error response. */
export async function adminGuard() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Please sign in.' }, { status: 401 }) };
  }
  if (user.role !== 'ADMIN') {
    return { user: null, error: NextResponse.json({ error: 'Not allowed.' }, { status: 403 }) };
  }
  return { user, error: null };
}

/** "65" or "65.50" -> cents. Anything unparseable becomes 0. */
export function priceToCents(input: string) {
  const value = Number.parseFloat(String(input).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}
