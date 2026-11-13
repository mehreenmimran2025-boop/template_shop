import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import AdminNav from '@/components/AdminNav';
import AccountMenu from '@/components/AccountMenu';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // /admin/login is the only admin route reachable without a session — render it bare.
  if (!user || user.role !== 'ADMIN') {
    return <div className="flex min-h-screen items-center justify-center bg-cream px-5">{children}</div>;
  }

  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="sticky top-0 z-40 border-b border-[#2A1D15] bg-[#3B2A1B] text-[#E5DCC4]">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-display text-xl font-semibold text-sand">
              {settings.storeName}
            </Link>
            <span className="rounded-full bg-wine px-2.5 py-0.5 text-[11px] font-semibold tracking-wide">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-sand/80 hover:text-sand">View shop ↗</Link>
            <AccountMenu name={user.name} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 lg:flex-row">
        <AdminNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
