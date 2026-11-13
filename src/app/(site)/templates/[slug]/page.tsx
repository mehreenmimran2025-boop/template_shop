import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getShopContext } from '@/lib/shop';
import { fileSize, parsePreviews, parseColors } from '@/lib/format';
import Gallery from '@/components/Gallery';
import BuyPanel from '@/components/BuyPanel';
import TemplateCard from '@/components/TemplateCard';
import WishlistButton from '@/components/WishlistButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const template = await prisma.template.findUnique({ where: { slug: params.slug } });
  if (!template) return { title: 'Not found' };
  return { title: template.title, description: template.tagline };
}

export default async function TemplatePage({ params }: { params: { slug: string } }) {
  const { session, price, wishlist } = await getShopContext({ wishlist: true });
  const template = await prisma.template.findUnique({ where: { slug: params.slug } });

  if (!template || (!template.published && session?.role !== 'ADMIN')) notFound();

  const [paidOrder, pendingOrder, related] = await Promise.all([
    session
      ? prisma.order.findFirst({
          where: { userId: session.uid, templateId: template.id, status: 'PAID' },
        })
      : null,
    session
      ? prisma.order.findFirst({
          where: { userId: session.uid, templateId: template.id, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        })
      : null,
    prisma.template.findMany({
      where: { published: true, category: template.category, NOT: { id: template.id } },
      take: 3,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const previews = parsePreviews(template.previews);
  const colors = parseColors(template.colors);
  const includes = template.includes.split('\n').map((l) => l.trim()).filter(Boolean);
  const tags = template.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const priceText = template.priceCents === 0 ? 'Free' : price(template.priceCents).main;

  return (
    <div className="container-x py-12">
      <nav className="mb-8 flex items-center gap-2 text-sm text-brown">
        <Link href="/templates" className="hover:text-wine">Templates</Link>
        <span>/</span>
        <Link href={'/templates?category=' + encodeURIComponent(template.category)} className="hover:text-wine">
          {template.category}
        </Link>
      </nav>

      {!template.published ? (
        <p className="mb-6 rounded-xl border border-mauve bg-mauve-pale px-4 py-3 text-sm text-wine">
          Draft — only you can see this page.
        </p>
      ) : null}

      <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Gallery images={previews} title={template.title} />

          {template.description ? (
            <div className="mt-10">
              <h2 className="font-display text-2xl text-cocoa">About this template</h2>
              <div className="mt-3 space-y-4 text-sm leading-relaxed text-brown">
                {template.description.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <p className="eyebrow">{template.category}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-wine">{template.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-brown">{template.tagline}</p>

          <div className="mt-7">
            <BuyPanel
              templateId={template.id}
              slug={template.slug}
              price={priceText}
              signedIn={Boolean(session)}
              owned={Boolean(paidOrder)}
              pendingOrderId={pendingOrder ? pendingOrder.publicId : null}
              colors={colors}
            />

            {paidOrder ? null : (
              <div className="mt-3">
                <WishlistButton
                  templateId={template.id}
                  initialSaved={wishlist.has(template.id)}
                  signedIn={Boolean(session)}
                  returnTo={'/templates/' + template.slug}
                  variant="full"
                />
              </div>
            )}

          </div>

          {includes.length > 0 ? (
            <div className="mt-8">
              <h2 className="eyebrow">What you get</h2>
              <ul className="mt-3 space-y-2.5">
                {includes.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-cocoa">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-mauve" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <dl className="mt-8 divide-y divide-sand/70 border-y border-sand/70 text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-brown">File</dt>
              <dd className="text-cocoa">{template.fileName || 'Added on confirmation'}</dd>
            </div>
            {template.fileSize > 0 ? (
              <div className="flex justify-between py-3">
                <dt className="text-brown">Size</dt>
                <dd className="text-cocoa">{fileSize(template.fileSize)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between py-3">
              <dt className="text-brown">Access</dt>
              <dd className="text-cocoa">Lifetime, in your library</dd>
            </div>
          </dl>

          {tags.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={'/templates?q=' + encodeURIComponent(tag)}
                  className="rounded-full bg-sand-pale px-3 py-1 text-xs text-brown hover:bg-sand"
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-24">
          <h2 className="font-display text-3xl text-cocoa">More in {template.category}</h2>
          <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <TemplateCard
                key={item.id}
                template={item}
                price={price(item.priceCents)}
                saved={wishlist.has(item.id)}
                signedIn={Boolean(session)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
