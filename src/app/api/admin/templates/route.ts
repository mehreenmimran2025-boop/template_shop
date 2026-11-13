import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminGuard, priceToCents } from '@/lib/admin';
import { savePreview, saveTemplateFile } from '@/lib/storage';
import { slugify, parseColors } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  const form = await req.formData();
  const title = String(form.get('title') ?? '').trim();
  if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 });

  // Parse color options early so we can check if per-color files cover the download requirement.
  let colorOptions = parseColors(String(form.get('colors') ?? '[]'));

  // Upload per-color files and attach filePath/fileName to each color option.
  for (let i = 0; i < colorOptions.length; i++) {
    const cf = form.get(`color_file_${i}`);
    if (cf instanceof File && cf.size > 0) {
      const stored = await saveTemplateFile(cf);
      colorOptions[i] = { ...colorOptions[i], filePath: stored, fileName: cf.name };
    }
  }

  const hasColorFiles = colorOptions.some((c) => c.filePath);

  const file = form.get('file');
  const hasMainFile = file instanceof File && file.size > 0;

  if (!hasMainFile && !hasColorFiles) {
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

  let storedName = '';
  let fileName = '';
  let fileSize = 0;
  if (hasMainFile && file instanceof File) {
    storedName = await saveTemplateFile(file);
    fileName = file.name;
    fileSize = file.size;
  }

  const colors = JSON.stringify(colorOptions);

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
      fileName,
      filePath: storedName,
      fileSize,
      published: form.get('published') === '1',
      featured: form.get('featured') === '1',
      sortOrder: Number(form.get('sortOrder') ?? 0) || 0,
    },
  });

  return NextResponse.json({ ok: true, id: template.id, slug: template.slug });
}
