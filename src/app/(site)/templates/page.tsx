import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getShopContext } from '@/lib/shop';
import TemplatesViewToggle from '@/components/TemplatesViewToggle';

export const metadata = { title: 'Templates' };

type SearchParams = { q?: string; category?: string; sort?: string };

const SORTS: Record<string, Prisma.TemplateOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  'price-low': [{ priceCents: 'asc' }],
  'price-high': [{ priceCents: 'desc' }],
  name: [{ title: 'asc' }],
};

export default async function TemplatesPage({ searchParams }: { searchParams: SearchParams }) {
  const q = (searchParams.q ?? '').trim();
  const category = (searchParams.category ?? '').trim();
  const sort = searchParams.sort && SORTS[searchParams.sort] ? searchParams.sort : 'newest';

  const where: Prisma.TemplateWhereInput = { published: true };
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { tagline: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
      { category: { contains: q } },
    ];
  }

  const { session, price, wishlist } = await getShopContext({ wishlist: true });

  const [templates, categories] = await Promise.all([
    prisma.template.findMany({ where, orderBy: SORTS[sort] }),
    prisma.template.findMany({
      where: { published: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
  ]);

  const ownedIds = new Set<string>();
  if (session) {
    const paid = await prisma.order.findMany({
      where: { userId: session.uid, status: 'PAID' },
      select: { templateId: true },
    });
    paid.forEach((o) => ownedIds.add(o.templateId));
  }

  function href(next: Partial<SearchParams>) {
    const params = new URLSearchParams();
    const merged = { q, category, sort, ...next };
    if (merged.q) params.set('q', merged.q);
    if (merged.category) params.set('category', merged.category);
    if (merged.sort && merged.sort !== 'newest') params.set('sort', merged.sort);
    const query = params.toString();
    return query ? '/templates?' + query : '/templates';
  }

  return (
    <div className="container-x py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">The collection</p>
        <h1 className="mt-2 font-display text-5xl text-wine">Templates</h1>
        <p className="mt-4 text-brown">Buy once, keep forever.</p>
      </div>

      <form className="mt-10 flex flex-col gap-3 sm:flex-row" action="/templates">
        {category ? <input type="hidden" name="category" value={category} /> : null}
        {sort !== 'newest' ? <input type="hidden" name="sort" value={sort} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search templates, categories, tags…"
          className="input sm:max-w-md"
          aria-label="Search templates"
        />
        <button type="submit" className="btn-primary">Search</button>
        {q ? (
          <Link href={href({ q: '' })} className="btn-ghost">Clear</Link>
        ) : null}
      </form>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href={href({ category: '' })}
          className={
            'rounded-full border px-4 py-1.5 text-sm transition ' +
            (category === ''
              ? 'border-wine bg-wine text-sand-light'
              : 'border-sand bg-surface text-cocoa hover:border-brown')
          }
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.category}
            href={href({ category: c.category })}
            className={
              'rounded-full border px-4 py-1.5 text-sm transition ' +
              (category === c.category
                ? 'border-wine bg-wine text-sand-light'
                : 'border-sand bg-surface text-cocoa hover:border-brown')
            }
          >
            {c.category}
          </Link>
        ))}

        <div className="ml-auto flex items-center gap-2 text-sm text-brown">
          <span className="hidden sm:inline">Sort</span>
          {[
            ['newest', 'Newest'],
            ['price-low', 'Price ↑'],
            ['price-high', 'Price ↓'],
            ['name', 'A–Z'],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={href({ sort: value })}
              className={
                'rounded-full px-3 py-1.5 text-xs transition ' +
                (sort === value ? 'bg-sand text-cocoa' : 'hover:bg-sand-pale')
              }
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="card mt-12 p-12 text-center">
          <p className="font-display text-2xl text-cocoa">Nothing matches that yet</p>
          <p className="mt-2 text-sm text-brown">Try a different search, or browse everything.</p>
          <Link href="/templates" className="btn-ghost mt-6">Show all templates</Link>
        </div>
      ) : (
        <TemplatesViewToggle
          templates={templates}
          price={price}
          ownedIds={Array.from(ownedIds)}
          wishlistIds={Array.from(wishlist)}
          signedIn={Boolean(session)}
        />
      )}
    </div>
  );
}
