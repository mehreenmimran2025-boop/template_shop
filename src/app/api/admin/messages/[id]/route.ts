import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await adminGuard();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? '');
  if (action !== 'handled' && action !== 'unhandled') {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  await prisma.message.update({
    where: { id: params.id },
    data: { handled: action === 'handled' },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await adminGuard();
  if (error) return error;

  await prisma.message.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
