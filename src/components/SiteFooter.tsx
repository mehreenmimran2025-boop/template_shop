import Link from 'next/link';
import { getShopContext } from '@/lib/shop';
import { COUNTRIES } from '@/lib/currency';
import CountryPicker from './CountryPicker';

export default async function SiteFooter() {
  const { settings: s, country } = await getShopContext();
  const year = new Date().getFullYear();
  const instagramHandle = s.instagram.replace(/^@/, '');

  return (
    <footer className="mt-24 border-t border-sand/60 bg-sand-pale/50">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="font-display text-2xl text-wine">{s.storeName}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-brown">{s.tagline}</p>
          <div className="mt-6 max-w-xs">
            <CountryPicker countries={COUNTRIES} value={country.code} />
          </div>
        </div>

        <div>
          <p className="eyebrow mb-3">Shop</p>
          <ul className="space-y-2 text-sm text-cocoa">
            <li><Link href="/templates" className="hover:text-wine">All templates</Link></li>
            <li><Link href="/wishlist" className="hover:text-wine">Wishlist</Link></li>
            <li><Link href="/library" className="hover:text-wine">My library</Link></li>
            <li><Link href="/how-it-works" className="hover:text-wine">How it works</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-3">Contact</p>
          <ul className="space-y-2 text-sm text-cocoa">
            {s.contactEmail ? (
              <li><a href={'mailto:' + s.contactEmail} className="hover:text-wine">{s.contactEmail}</a></li>
            ) : null}
            {s.whatsapp ? (
              <li>
                <a href={'https://wa.me/' + s.whatsapp.replace(/[^0-9]/g, '')} target="_blank" rel="noreferrer" className="hover:text-wine">
                  WhatsApp
                </a>
              </li>
            ) : null}
            {instagramHandle ? (
              <li>
                <a href={'https://instagram.com/' + instagramHandle} target="_blank" rel="noreferrer" className="hover:text-wine">
                  @{instagramHandle}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-sand/60">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-brown sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {s.storeName} — for personal and small-business use.</p>
          <p>Made by hand, one order at a time.</p>
        </div>
      </div>
    </footer>
  );
}
