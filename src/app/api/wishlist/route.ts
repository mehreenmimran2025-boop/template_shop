import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Saving needs an account — there is nowhere to keep a guest's list. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Create a free account to save templates for later.', needsAccount: true },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const templateId = String(body?.templateId ?? '');
  const action = String(body?.action ?? 'toggle');

  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template || !template.published) {
    return NextResponse.json({ error: 'That template is not available.' }, { status: 404 });
  }

  const existing = await prisma.wishlist.findUnique({
    where: { userId_templateId: { userId: user.id, templateId } },
  });

  const shouldSave = action === 'add' || (action === 'toggle' && !existing);

  if (shouldSave && !existing) {
    await prisma.wishlist.create({ data: { userId: user.id, templateId } });
  } else if (!shouldSave && existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
  }

  const count = await prisma.wishlist.count({ where: { userId: user.id } });
  return NextResponse.json({ ok: true, saved: shouldSave, count });
}
