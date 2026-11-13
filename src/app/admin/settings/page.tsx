import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import SettingsForm from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <div>
      <h1 className="font-display text-4xl text-wine">Store settings</h1>
      <p className="mt-2 text-sm text-brown">Your shop name, wording and payment details.</p>

      <div className="mt-8">
        <SettingsForm
          initial={{
            storeName: settings.storeName,
            tagline: settings.tagline,
            heroHeadline: settings.heroHeadline,
            heroSub: settings.heroSub,
            aboutText: settings.aboutText,
            paymentInstructions: settings.paymentInstructions,
            paymentDetails: settings.paymentDetails,
            contactEmail: settings.contactEmail,
            whatsapp: settings.whatsapp,
            instagram: settings.instagram,
            baseCountry: settings.baseCountry,
            defaultCountry: settings.defaultCountry,
            inboxEmail: settings.inboxEmail,
          }}
        />
      </div>
    </div>
  );
}
