import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminGuard, priceToCents } from '@/lib/admin';
import { deletePreview, deleteTemplateFile, savePreview, saveTemplateFile } from '@/lib/storage';
import { parsePreviews, parseColors, slugify } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Full edit (multipart form). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await adminGuard();
  if (error) return error;

  const template = await prisma.template.findUnique({ where: { id: params.id } });
  if (!template) return NextResponse.json({ error: 'Template not found.' }, { status: 404 });

  const form = await req.formData();
  const title = String(form.get('title') ?? '').trim();
  if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 });

  let slug = slugify(String(form.get('slug') ?? '') || title);
  const clash = await prisma.template.findUnique({ where: { slug } });
  if (clash && clash.id !== template.id) slug = slug + '-' + Math.random().toString(36).slice(2, 6);

  // Previews the admin kept, plus any newly uploaded ones.
  let kept: string[] = [];
  try {
    const parsed = JSON.parse(String(form.get('keptPreviews') ?? '[]'));
    if (Array.isArray(parsed)) kept = parsed.filter((p) => typeof p === 'string');
  } catch {
    kept = parsePreviews(template.previews);
  }

  const removed = parsePreviews(template.previews).filter((p) => !kept.includes(p));
  for (const path of removed) await deletePreview(path);

  for (const entry of form.getAll('previews')) {
    if (entry instanceof File && entry.size > 0) {
      const saved = await savePreview(entry);
      if (saved) kept.push(saved);
    }
  }

  let fileName = template.fileName;
  let filePath = template.filePath;
  let fileSize = template.fileSize;

  const file = form.get('file');
  if (file instanceof File && file.size > 0) {
    const storedName = await saveTemplateFile(file);
    await deleteTemplateFile(template.filePath);
    fileName = file.name;
    filePath = storedName;
    fileSize = file.size;
  }

  // Merge incoming color options with existing filePaths for colors that didn't get a new file.
  let colorOptions = parseColors(String(form.get('colors') ?? ''));
  if (colorOptions.length === 0) {
    colorOptions = parseColors(template.colors);
  } else {
    const existing = parseColors(template.colors);
    for (let i = 0; i < colorOptions.length; i++) {
      const cf = form.get(`color_file_${i}`);
      if (cf instanceof File && cf.size > 0) {
        const stored = await saveTemplateFile(cf);
        colorOptions[i] = { ...colorOptions[i], filePath: stored, fileName: cf.name };
      } else {
        // Preserve existing filePath by matching on name.
        const match = existing.find((e) => e.name === colorOptions[i].name);
        if (match?.filePath) {
          colorOptions[i] = { ...colorOptions[i], filePath: match.filePath, fileName: match.fileName };
        }
      }
    }
  }
  const colors = JSON.stringify(colorOptions);

  await prisma.template.update({
    where: { id: template.id },
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
      previews: JSON.stringify(kept),
      fileName,
      filePath,
      fileSize,
      published: form.get('published') === '1',
      featured: form.get('featured') === '1',
      sortOrder: Number(form.get('sortOrder') ?? 0) || 0,
    },
  });

  return NextResponse.json({ ok: true });
}

/** Small toggles. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await adminGuard();
  if (error) return error;

  const template = await prisma.template.findUnique({ where: { id: params.id } });
  if (!template) return NextResponse.json({ error: 'Template not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? '');

  if (action === 'toggle-published') {
    await prisma.template.update({ where: { id: template.id }, data: { published: !template.published } });
  } else if (action === 'toggle-featured') {
    await prisma.template.update({ where: { id: template.id }, data: { featured: !template.featured } });
  } else {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await adminGuard();
  if (error) return error;

  const template = await prisma.template.findUnique({
    where: { id: params.id },
    include: { _count: { select: { orders: true } } },
  });
  if (!template) return NextResponse.json({ error: 'Template not found.' }, { status: 404 });

  if (template._count.orders > 0) {
    return NextResponse.json(
      {
        error:
          'This template has ' +
          template._count.orders +
          ' order(s). Unpublish it instead — deleting it would take it out of your buyers’ libraries.',
      },
      { status: 409 },
    );
  }

  for (const path of parsePreviews(template.previews)) await deletePreview(path);
  await deleteTemplateFile(template.filePath);
  await prisma.template.delete({ where: { id: template.id } });

  return NextResponse.json({ ok: true });
}
