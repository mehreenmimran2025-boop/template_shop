import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getShopContext } from '@/lib/shop';
import { COUNTRIES } from '@/lib/currency';
import AccountMenu from './AccountMenu';
import CountryPicker from './CountryPicker';
import ThemeToggle from './ThemeToggle';

export default async function SiteHeader() {
  const { settings, session, country } = await getShopContext();

  const savedCount = session ? await prisma.wishlist.count({ where: { userId: session.uid } }) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-sand/60 bg-cream/85 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-wine font-display text-lg text-sand-pale">
            {settings.storeName.trim().charAt(0).toUpperCase() || 'T'}
          </span>
          <span className="hidden font-display text-xl font-semibold text-wine group-hover:text-wine-deep sm:block">
            {settings.storeName}
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/templates" className="rounded-full px-3 py-2 text-sm text-cocoa hover:bg-sand-pale">
            Templates
          </Link>
          {session ? (
            <>
              <Link href="/wishlist" className="relative rounded-full px-3 py-2 text-sm text-cocoa hover:bg-sand-pale">
                Wishlist
                {savedCount > 0 ? (
                  <span className="ml-1.5 rounded-full bg-mauve-pale px-1.5 py-0.5 text-[10px] font-semibold text-wine">
                    {savedCount}
                  </span>
                ) : null}
              </Link>
              <Link href="/library" className="rounded-full px-3 py-2 text-sm text-cocoa hover:bg-sand-pale">
                My library
              </Link>
            </>
          ) : null}
          {session?.role === 'ADMIN' ? (
            <Link href="/admin" className="rounded-full px-3 py-2 text-sm font-medium text-olive hover:bg-olive-pale">
              Admin
            </Link>
          ) : null}

          <CountryPicker countries={COUNTRIES} value={country.code} variant="compact" />
          <ThemeToggle />

          {session ? (
            <AccountMenu name={session.name} />
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 text-sm text-cocoa hover:bg-sand-pale">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary btn-sm hidden sm:inline-flex">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
