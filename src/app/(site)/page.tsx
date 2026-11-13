import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getShopContext } from '@/lib/shop';
import TemplateCard from '@/components/TemplateCard';
import { parsePreviews } from '@/lib/format';

export const revalidate = 60; // recheck every 60 seconds

export default async function HomePage() {
  const { settings, session, price, wishlist } = await getShopContext({ wishlist: true });

  const [featured, latest, categories, publishedCount] = await Promise.all([
    prisma.template.findMany({
      where: { published: true, featured: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 3,
    }),
    prisma.template.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.template.findMany({
      where: { published: true },
      select: { category: true },
      distinct: ['category'],
      take: 8,
    }),
    prisma.template.count({ where: { published: true } }),
  ]);

  const showcase = featured.length > 0 ? featured : latest.slice(0, 3);
  const instagramHandle = settings.instagram.replace(/^@/, '').trim();
  const isOwner = session?.role === 'ADMIN';
  const heroImage = parsePreviews(showcase[0]?.previews ?? '[]')[0];

  return (
    <>
      <section className="relative overflow-hidden border-b border-sand/60 bg-gradient-to-b from-sand-pale via-cream to-cream">
        <div className="container-x grid items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <p className="eyebrow">{settings.tagline}</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] text-wine sm:text-6xl">
              {settings.heroHeadline}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-brown sm:text-lg">{settings.heroSub}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/templates" className="btn-primary">
                Browse the collection
              </Link>
              <Link href={session ? '/library' : '/how-it-works'} className="btn-ghost">
                {session ? 'Open my library' : 'How it works'}
              </Link>
            </div>
            <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-sand/70 pt-7">
              <div>
                <dt className="eyebrow">Templates</dt>
                <dd className="font-display text-2xl text-cocoa">{publishedCount}</dd>
              </div>
              <div>
                <dt className="eyebrow">Delivery</dt>
                <dd className="font-display text-2xl text-cocoa">Same day, usually</dd>
              </div>
              <div>
                <dt className="eyebrow">Access</dt>
                <dd className="font-display text-2xl text-cocoa">Yours for life</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-mauve/30 blur-2xl" />
            <div className="absolute -bottom-10 -left-6 h-44 w-44 rounded-full bg-olive/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-xl2 border border-sand bg-surface shadow-lift">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImage} alt="" className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center bg-wine font-display text-5xl text-sand">
                  {settings.storeName.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {showcase.length > 0 ? (
        <section className="container-x py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Featured</p>
              <h2 className="mt-2 font-display text-4xl text-cocoa">Start here</h2>
            </div>
            <Link href="/templates" className="hidden text-sm text-wine link-underline sm:block">
              See everything
            </Link>
          </div>
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                price={price(template.priceCents)}
                saved={wishlist.has(template.id)}
                signedIn={Boolean(session)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="container-x py-24">
          <div className="card mx-auto max-w-lg p-10 text-center">
            <h2 className="font-display text-3xl text-cocoa">The shelves are empty</h2>
            <p className="mt-3 text-sm leading-relaxed text-brown">
              Add your first template from the admin panel and it appears here.
            </p>
            <Link href="/admin" className="btn-primary mt-7">
              Go to admin
            </Link>
          </div>
        </section>
      )}

      <section className="border-y border-sand/60 bg-sand-pale/50 py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Come say hello</p>
            <h2 className="mt-2 font-display text-4xl leading-tight text-cocoa">Find me here</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-brown">
              New work goes up on Instagram. For anything else — a question, a custom colour, a size that does not exist
              yet — just write to me.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {instagramHandle ? (
              <a
                href={'https://instagram.com/' + instagramHandle}
                target="_blank"
                rel="noreferrer"
                className="card flex flex-col justify-between gap-3 p-6 transition hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="eyebrow">Instagram</span>
                <span className="font-display text-2xl text-wine">@{instagramHandle}</span>
                <span className="text-xs text-brown">Follow along →</span>
              </a>
            ) : isOwner ? (
              <div className="card border-dashed p-6">
                <span className="eyebrow">Instagram</span>
                <p className="mt-2 text-sm text-brown">
                  Add it in <Link href="/admin/settings" className="link-underline text-wine">Store settings</Link>.
                </p>
              </div>
            ) : null}

            {settings.contactEmail ? (
              <a
                href={'mailto:' + settings.contactEmail}
                className="card flex flex-col justify-between gap-3 p-6 transition hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="eyebrow">Email</span>
                <span className="break-all font-display text-2xl text-wine">{settings.contactEmail}</span>
                <span className="text-xs text-brown">Write to me →</span>
              </a>
            ) : isOwner ? (
              <div className="card border-dashed p-6">
                <span className="eyebrow">Email</span>
                <p className="mt-2 text-sm text-brown">
                  Add it in <Link href="/admin/settings" className="link-underline text-wine">Store settings</Link>.
                </p>
              </div>
            ) : null}

            {settings.whatsapp ? (
              <a
                href={'https://wa.me/' + settings.whatsapp.replace(/[^0-9]/g, '')}
                target="_blank"
                rel="noreferrer"
                className="card flex flex-col justify-between gap-3 p-6 transition hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="eyebrow">WhatsApp</span>
                <span className="font-display text-2xl text-wine">Message me</span>
                <span className="text-xs text-brown">Usually a quick reply →</span>
              </a>
            ) : isOwner ? (
              <div className="card border-dashed p-6">
                <span className="eyebrow">WhatsApp</span>
                <p className="mt-2 text-sm text-brown">
                  Optional — add it in{' '}
                  <Link href="/admin/settings" className="link-underline text-wine">Store settings</Link>.
                </p>
              </div>
            ) : null}

            <div className="card bg-wine p-6 text-sand-light">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sand/70">Right here</span>
              <p className="mt-2 font-display text-2xl">The Email me button</p>
              <p className="mt-2 text-xs leading-relaxed text-sand/80">
                Bottom-right of every page. No account needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="container-x py-20">
          <p className="eyebrow">Browse by category</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((c) => (
              <Link
                key={c.category}
                href={'/templates?category=' + encodeURIComponent(c.category)}
                className="rounded-full border border-sand bg-surface px-5 py-2.5 text-sm text-cocoa transition hover:border-wine hover:text-wine"
              >
                {c.category}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
