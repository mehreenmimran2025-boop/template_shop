import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isBlobUrl, templateFilePath } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Serves a purchased file. Every guard here has to pass — this is the only way to get the file. */
export async function GET(_req: Request, { params }: { params: { orderId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { publicId: params.orderId },
    include: { template: true },
  });

  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  const isOwner = order.userId === user.id;
  const isAdmin = user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Not your order.' }, { status: 403 });

  if (order.status !== 'PAID') {
    return NextResponse.json(
      { error: 'This order has not been confirmed yet, so the download is still locked.' },
      { status: 402 },
    );
  }

  if (!order.template.filePath) {
    return NextResponse.json({ error: 'The file is not attached to this template yet.' }, { status: 409 });
  }

  const downloadName = order.template.fileName || order.template.slug;

  if (isOwner) {
    await prisma.download.create({ data: { orderId: order.id, userId: user.id } });
  }

  // Vercel Blob: fetch the file and pipe it through (blob URL stays hidden from buyer)
  if (isBlobUrl(order.template.filePath)) {
    const blobRes = await fetch(order.template.filePath);
    if (!blobRes.ok) return NextResponse.json({ error: 'The file could not be retrieved.' }, { status: 502 });
    return new NextResponse(blobRes.body, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${downloadName.replace(/"/g, '')}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // Local filesystem fallback (dev without Vercel Blob)
  const { createReadStream } = await import('fs');
  const { promises: fs } = await import('fs');
  const { Readable } = await import('stream');

  const absolute = templateFilePath(order.template.filePath);
  try { await fs.access(absolute); } catch {
    return NextResponse.json({ error: 'The file is missing on the server.' }, { status: 410 });
  }

  const stat = await fs.stat(absolute);
  const stream = Readable.toWeb(createReadStream(absolute)) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(stat.size),
      'Content-Disposition': `attachment; filename="${downloadName.replace(/"/g, '')}"`,
      'Cache-Control': 'no-store',
    },
  });
}
