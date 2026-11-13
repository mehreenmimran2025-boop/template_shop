import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await adminGuard();
  if (error) return error;
  if (user!.id === params.id) {
    return NextResponse.json({ error: 'You cannot block your own account.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? '');
  if (action !== 'block' && action !== 'unblock') {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  await prisma.user.update({ where: { id: params.id }, data: { blocked: action === 'block' } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await adminGuard();
  if (error) return error;
  if (user!.id === params.id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
