import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import TemplateForm from '@/components/TemplateForm';

export const dynamic = 'force-dynamic';

export default async function NewTemplatePage() {
  await requireAdmin();
  const [settings, categories] = await Promise.all([
    getSettings(),
    prisma.template.findMany({ select: { category: true }, distinct: ['category'] }),
  ]);

  return (
    <div>
      <Link href="/admin/templates" className="text-sm text-brown hover:text-wine">← Templates</Link>
      <h1 className="mt-4 font-display text-4xl text-wine">Add a template</h1>
      <p className="mt-2 text-sm text-brown">Buyers only get the file after you confirm their order.</p>

      <div className="mt-8">
        <TemplateForm currency={settings.currencySymbol} categories={categories.map((c) => c.category)} />
      </div>
    </div>
  );
}
