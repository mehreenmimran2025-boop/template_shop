import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword = String(body?.currentPassword ?? '');
  const newPassword = String(body?.newPassword ?? '');

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Use at least 6 characters.' }, { status: 400 });
  }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  return NextResponse.json({ ok: true });
}
