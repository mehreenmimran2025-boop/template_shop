import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ContactBox from '@/components/ContactBox';
import { getShopContext } from '@/lib/shop';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, session } = await getShopContext();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ContactBox
        storeName={settings.storeName}
        replyTo={settings.inboxEmail || settings.contactEmail}
        defaultName={session?.name ?? ''}
        defaultEmail={session?.email ?? ''}
      />
    </div>
  );
}
