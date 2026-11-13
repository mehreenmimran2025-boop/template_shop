import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { parsePreviews, parseColors } from '@/lib/format';
import TemplateForm from '@/components/TemplateForm';

export const dynamic = 'force-dynamic';

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const [settings, template, categories] = await Promise.all([
    getSettings(),
    prisma.template.findUnique({
      where: { id: params.id },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.template.findMany({ select: { category: true }, distinct: ['category'] }),
  ]);

  if (!template) notFound();

  const price = template.priceCents === 0 ? '0' : String(template.priceCents / 100);

  return (
    <div>
      <Link href="/admin/templates" className="text-sm text-brown hover:text-wine">← Templates</Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-wine">{template.title}</h1>
        <Link href={'/templates/' + template.slug} className="btn-ghost btn-sm" target="_blank">
          View page ↗
        </Link>
      </div>
      <p className="mt-2 text-sm text-brown">
        {template._count.orders} order{template._count.orders === 1 ? '' : 's'} so far.
      </p>

      <div className="mt-8">
        <TemplateForm
          currency={settings.currencySymbol}
          categories={categories.map((c) => c.category)}
          initial={{
            id: template.id,
            title: template.title,
            slug: template.slug,
            tagline: template.tagline,
            category: template.category,
            tags: template.tags,
            price,
            description: template.description,
            includes: template.includes,
            published: template.published,
            featured: template.featured,
            sortOrder: template.sortOrder,
            previews: parsePreviews(template.previews),
            fileName: template.fileName,
            colors: parseColors(template.colors),
          }}
        />
      </div>
    </div>
  );
}
