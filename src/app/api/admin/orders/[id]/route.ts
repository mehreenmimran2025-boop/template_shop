import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await adminGuard();
  if (error) return error;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? '');
  const adminNote = typeof body.adminNote === 'string' ? body.adminNote.slice(0, 1000) : undefined;

  if (action === 'confirm') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PAID', paidAt: order.paidAt ?? new Date(), ...(adminNote ? { adminNote } : {}) },
    });
  } else if (action === 'cancel') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', ...(adminNote ? { adminNote } : {}) },
    });
  } else if (action === 'reopen') {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'PENDING', paidAt: null } });
  } else if (action === 'note' && adminNote !== undefined) {
    await prisma.order.update({ where: { id: order.id }, data: { adminNote } });
  } else {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
