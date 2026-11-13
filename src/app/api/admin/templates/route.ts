import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminGuard, priceToCents } from '@/lib/admin';
import { savePreview, saveTemplateFile } from '@/lib/storage';
import { slugify } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  const form = await req.formData();
  const title = String(form.get('title') ?? '').trim();
  if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 });

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Attach the file buyers will download.' }, { status: 400 });
  }

  let slug = slugify(String(form.get('slug') ?? '') || title);
  const clash = await prisma.template.findUnique({ where: { slug } });
  if (clash) slug = slug + '-' + Math.random().toString(36).slice(2, 6);

  const previews: string[] = [];
  for (const entry of form.getAll('previews')) {
    if (entry instanceof File && entry.size > 0) {
      const saved = await savePreview(entry);
      if (saved) previews.push(saved);
    }
  }

  const storedName = await saveTemplateFile(file);

  let colors = '[]';
  try {
    const parsed = JSON.parse(String(form.get('colors') ?? '[]'));
    if (Array.isArray(parsed)) colors = JSON.stringify(parsed);
  } catch { /* leave as [] */ }

  const template = await prisma.template.create({
    data: {
      slug,
      title,
      tagline: String(form.get('tagline') ?? '').trim(),
      description: String(form.get('description') ?? ''),
      includes: String(form.get('includes') ?? ''),
      category: String(form.get('category') ?? 'General').trim() || 'General',
      tags: String(form.get('tags') ?? '').trim(),
      priceCents: priceToCents(String(form.get('price') ?? '0')),
      colors,
      previews: JSON.stringify(previews),
      fileName: file.name,
      filePath: storedName,
      fileSize: file.size,
      published: form.get('published') === '1',
      featured: form.get('featured') === '1',
      sortOrder: Number(form.get('sortOrder') ?? 0) || 0,
    },
  });

  return NextResponse.json({ ok: true, id: template.id, slug: template.slug });
}
