import Link from 'next/link';
import { parsePreviews } from '@/lib/format';
import type { PriceLabel } from '@/lib/countries';
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

export default function TemplateCard({
  template,
  price,
  owned = false,
  saved = false,
  signedIn = false,
  refreshOnChange = false,
}: {
  template: CardTemplate;
  price: PriceLabel;
  owned?: boolean;
  saved?: boolean;
  signedIn?: boolean;
  refreshOnChange?: boolean;
}) {
  const cover = parsePreviews(template.previews)[0];

  return (
    <div className="card group relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      {owned ? null : (
        <WishlistButton
          templateId={template.id}
          initialSaved={saved}
          signedIn={signedIn}
          returnTo={'/templates/' + template.slug}
          refreshOnChange={refreshOnChange}
        />
      )}

      <Link href={'/templates/' + template.slug} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-sand-pale">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={template.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-3xl text-mauve">
              {template.title.charAt(0)}
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brown">
            {template.category}
          </span>
          {owned ? (
            <span className="absolute right-3 top-3 rounded-full bg-olive px-2.5 py-1 text-[11px] font-semibold text-sand-pale">
              In your library
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-5">
          <h3 className="font-display text-xl font-semibold leading-snug text-cocoa group-hover:text-wine">
            {template.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-brown">{template.tagline}</p>
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-sand/60 pt-4">
            <span className="font-display text-lg font-semibold text-wine">
              {template.priceCents === 0 ? 'Free' : price.main}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-mauve group-hover:text-wine">
              View →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
