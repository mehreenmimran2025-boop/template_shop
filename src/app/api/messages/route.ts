import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const name = String(body.name ?? '').trim().slice(0, 120);
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200);
  const text = String(body.body ?? '').trim().slice(0, 4000);
  const page = String(body.page ?? '').slice(0, 200);

  if (!name) return NextResponse.json({ error: 'Please add your name.' }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'That email does not look right.' }, { status: 400 });
  }
  if (text.length < 2) return NextResponse.json({ error: 'Please write a message.' }, { status: 400 });

  // Gentle flood guard: a few messages from one address in ten minutes is plenty.
  const recent = await prisma.message.count({
    where: { email, createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } },
  });
  if (recent >= 3) {
    return NextResponse.json(
      { error: 'You have already sent a few messages — I will reply to those first.' },
      { status: 429 },
    );
  }

  const session = await getSession();

  await prisma.message.create({
    data: { name, email, body: text, page, userId: session?.uid ?? null },
  });

  return NextResponse.json({ ok: true });
}
