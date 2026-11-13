import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }
  if (user.blocked) {
    return NextResponse.json({ error: 'This account has been suspended.' }, { status: 403 });
  }

  await setSession({
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
  });
  return NextResponse.json({ ok: true, role: user.role });
}
