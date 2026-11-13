import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Two modes:
 *  - JSON body  → production: Vercel Blob client-upload token exchange
 *  - FormData   → local dev fallback: save file to local storage
 */
export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  const contentType = req.headers.get('content-type') ?? '';

  // ── Local dev: direct multipart ───────────────────────────────────────────
  if (contentType.includes('multipart/form-data')) {
    const { saveTemplateFile } = await import('@/lib/storage');
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'No file.' }, { status: 400 });
    }
    const url = await saveTemplateFile(file);
    return NextResponse.json({ url, name: file.name, size: file.size });
  }

  // ── Production: Vercel Blob client-upload token exchange ──────────────────
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Blob storage not configured.' }, { status: 500 });
  }

  try {
    const blob = await import('@vercel/blob');
    const body = await req.json();
    const response = await blob.handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'application/pdf',
          'application/zip',
          'application/x-zip-compressed',
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/gif',
        ],
        maximumSizeInBytes: 200 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
