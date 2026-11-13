import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getShopContext } from '@/lib/shop';
import TemplateCard from '@/components/TemplateCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wishlist' };

export default async function WishlistPage() {
  const user = await requireUser('/wishlist');
  const { price, session } = await getShopContext();

  const [saved, owned] = await Promise.all([
    prisma.wishlist.findMany({
      where: { userId: user.id, template: { published: true } },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { userId: user.id, status: 'PAID' },
      select: { templateId: true },
    }),
  ]);

  const ownedIds = new Set(owned.map((o) => o.templateId));

  return (
    <div className="container-x py-14">
      <p className="eyebrow">Saved for later</p>
      <h1 className="mt-2 font-display text-5xl text-wine">Your wishlist</h1>
      <p className="mt-4 max-w-xl text-brown">Things you have saved for later. Nothing is reserved or charged.</p>

      {saved.length === 0 ? (
        <div className="card mt-10 p-12 text-center">
          <p className="font-display text-2xl text-cocoa">Nothing saved yet</p>
          <p className="mt-2 text-sm text-brown">Tap the heart on any template and it waits for you here.</p>
          <Link href="/templates" className="btn-primary mt-6">See the collection</Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((entry) => (
            <TemplateCard
              key={entry.id}
              template={entry.template}
              price={price(entry.template.priceCents)}
              owned={ownedIds.has(entry.templateId)}
              saved
              signedIn={Boolean(session)}
              refreshOnChange
            />
          ))}
        </div>
      )}
    </div>
  );
}
