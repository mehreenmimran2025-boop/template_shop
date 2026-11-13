import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { fileSize, money, parsePreviews } from '@/lib/format';
import TemplateRowActions from '@/components/TemplateRowActions';

export const dynamic = 'force-dynamic';

export default async function AdminTemplatesPage() {
  await requireAdmin();
  const [settings, templates] = await Promise.all([
    getSettings(),
    prisma.template.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { orders: true } } },
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-wine">Templates</h1>
          <p className="mt-2 text-sm text-brown">{templates.length} in the shop</p>
        </div>
        <Link href="/admin/templates/new" className="btn-primary">Add a template</Link>
      </div>

      {templates.length === 0 ? (
        <div className="card mt-8 p-12 text-center">
          <p className="font-display text-2xl text-cocoa">No templates yet</p>
          <p className="mt-2 text-sm text-brown">Add your first one and it goes live the moment you publish it.</p>
          <Link href="/admin/templates/new" className="btn-primary mt-6">Add a template</Link>
        </div>
      ) : (
        <div className="card mt-8 divide-y divide-sand/60">
          {templates.map((template) => {
            const cover = parsePreviews(template.previews)[0];
            return (
              <div key={template.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-sand-pale">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={'/admin/templates/' + template.id} className="font-medium text-cocoa hover:text-wine">
                      {template.title}
                    </Link>
                    {template.published ? (
                      <span className="badge-paid">Live</span>
                    ) : (
                      <span className="badge-pending">Draft</span>
                    )}
                    {template.featured ? <span className="badge bg-mauve-pale text-wine">Featured</span> : null}
                  </div>
                  <p className="mt-1 text-xs text-brown">
                    {template.category} · {money(template.priceCents, settings.currencySymbol)} ·{' '}
                    {template.fileName || 'no file'} {template.fileSize > 0 ? '(' + fileSize(template.fileSize) + ')' : ''} ·{' '}
                    {template._count.orders} order{template._count.orders === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {template.published ? (
                    <Link href={'/templates/' + template.slug} className="btn-ghost btn-sm" target="_blank" rel="noreferrer">
                      View ↗
                    </Link>
                  ) : null}
                  <Link href={'/admin/templates/' + template.id} className="btn-ghost btn-sm">Edit</Link>
                  <TemplateRowActions id={template.id} title={template.title} published={template.published} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
