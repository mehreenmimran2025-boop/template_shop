'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PriceLabel } from '@/lib/countries';
import TemplateCard from './TemplateCard';
import WishlistButton from './WishlistButton';

type CardTemplate = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  priceCents: number;
  previews: string;
};

type Props = {
  templates: CardTemplate[];
  price: (cents: number) => PriceLabel;
  ownedIds: string[];
  wishlistIds: string[];
  signedIn: boolean;
};

export default function TemplatesViewToggle({ templates, price, ownedIds, wishlistIds, signedIn }: Props) {
  const [view, setView] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem('tmpl_view') as 'grid' | 'list') ?? 'grid'; } catch { return 'grid'; }
  });

  function setViewAndStore(v: 'grid' | 'list') {
    setView(v);
    try { localStorage.setItem('tmpl_view', v); } catch {}
  }

  return (
    <>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={() => setViewAndStore('grid')}
          aria-label="Grid view"
          className={
            'rounded-lg p-1.5 transition ' +
            (view === 'grid' ? 'bg-sand text-cocoa' : 'text-brown hover:bg-sand-pale')
          }
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="0" y="0" width="7" height="7" rx="1.5"/>
            <rect x="9" y="0" width="7" height="7" rx="1.5"/>
            <rect x="0" y="9" width="7" height="7" rx="1.5"/>
            <rect x="9" y="9" width="7" height="7" rx="1.5"/>
          </svg>
        </button>
        <button
          onClick={() => setViewAndStore('list')}
          aria-label="List view"
          className={
            'rounded-lg p-1.5 transition ' +
            (view === 'list' ? 'bg-sand text-cocoa' : 'text-brown hover:bg-sand-pale')
          }
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="0" y="0" width="16" height="3" rx="1.5"/>
            <rect x="0" y="6.5" width="16" height="3" rx="1.5"/>
            <rect x="0" y="13" width="16" height="3" rx="1.5"/>
          </svg>
        </button>
      </div>

      {view === 'grid' ? (
        <div className="mt-6 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              price={price(template.priceCents)}
              owned={ownedIds.includes(template.id)}
              saved={wishlistIds.includes(template.id)}
              signedIn={signedIn}
              refreshOnChange
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 divide-y divide-sand/50">
          {templates.map((template) => {
            const owned = ownedIds.includes(template.id);
            const p = price(template.priceCents);
            return (
              <div key={template.id} className="flex items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Link
                      href={'/templates/' + template.slug}
                      className="font-display text-lg text-cocoa hover:text-wine"
                    >
                      {template.title}
                    </Link>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-brown">
                      {template.category}
                    </span>
                    {owned ? (
                      <span className="rounded-full bg-olive-pale px-2 py-0.5 text-[10px] font-semibold text-olive">
                        Yours
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm text-brown">{template.tagline}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-display text-base font-semibold text-wine">
                    {template.priceCents === 0 ? 'Free' : p.main}
                  </span>
                  {!owned ? (
                    <WishlistButton
                      templateId={template.id}
                      initialSaved={wishlistIds.includes(template.id)}
                      signedIn={signedIn}
                      returnTo={'/templates/' + template.slug}
                      refreshOnChange
                    />
                  ) : null}
                  <Link href={'/templates/' + template.slug} className="btn-ghost btn-sm">
                    View →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
