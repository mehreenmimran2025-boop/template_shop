import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { orderCode } from '@/lib/format';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const templateId = String(body?.templateId ?? '');
  const note = String(body?.note ?? '').slice(0, 1000);
  const colorChoice = String(body?.colorChoice ?? '').slice(0, 100);

  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template || !template.published) {
    return NextResponse.json({ error: 'That template is not available.' }, { status: 404 });
  }

  const existing = await prisma.order.findFirst({
    where: { userId: user.id, templateId: template.id, status: { in: ['PAID', 'PENDING'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) return NextResponse.json({ ok: true, publicId: existing.publicId, existing: true });

  // Free templates need no confirmation — they unlock straight away.
  const isFree = template.priceCents === 0;

  let publicId = orderCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.order.findUnique({ where: { publicId } });
    if (!clash) break;
    publicId = orderCode();
  }

  const order = await prisma.order.create({
    data: {
      publicId,
      userId: user.id,
      templateId: template.id,
      amountCents: template.priceCents,
      buyerNote: note,
      colorChoice,
      status: isFree ? 'PAID' : 'PENDING',
      paidAt: isFree ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, publicId: order.publicId, status: order.status });
}
