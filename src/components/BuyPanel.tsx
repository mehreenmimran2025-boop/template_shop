'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ColorOption = { name: string; hex: string; hex2?: string; filePath?: string };

type Props = {
  templateId: string;
  slug: string;
  price: string;
  signedIn: boolean;
  owned: boolean;
  pendingOrderId: string | null;
  colors?: ColorOption[];
};

export default function BuyPanel({
  templateId,
  slug,
  price,
  signedIn,
  owned,
  pendingOrderId,
  colors = [],
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(colors[0] ?? null);

  if (owned) {
    return (
      <div className="rounded-xl2 border border-olive/30 bg-olive-pale/70 p-5">
        <p className="font-display text-xl text-olive">This one is already yours</p>
        <p className="mt-1 text-sm text-cocoa">It is in your library — download it any time.</p>
        <Link href="/library" className="btn-olive mt-4">Open my library</Link>
      </div>
    );
  }

  if (pendingOrderId) {
    return (
      <div className="rounded-xl2 border border-sand bg-sand-pale/70 p-5">
        <p className="font-display text-xl text-cocoa">Your order is in — thank you</p>
        <p className="mt-1 text-sm text-brown">
          How to pay is on your order page. Your download appears there once I confirm it.
        </p>
        <Link href={'/library/' + pendingOrderId} className="btn-primary mt-4">See your order</Link>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="rounded-xl2 border border-sand bg-surface p-5">
        <p className="font-display text-2xl text-wine">{price}</p>
        <p className="mt-1 text-sm text-brown">Sign in so your purchase is saved to your library.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={'/login?next=' + encodeURIComponent('/templates/' + slug)} className="btn-primary">
            Sign in to buy
          </Link>
          <Link href={'/signup?next=' + encodeURIComponent('/templates/' + slug)} className="btn-ghost">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  async function placeOrder() {
    if (colors.length > 0 && !selectedColor) {
      setError('Please pick a colour before placing your order.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, colorChoice: selectedColor?.name ?? '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not place the order.');
      router.push('/library/' + data.publicId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl2 border border-sand bg-surface p-5 shadow-card">
      <p className="font-display text-3xl text-wine">{price}</p>
      <p className="mt-1 text-sm text-brown">One-time purchase · yours for life</p>

      {colors.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brown">
            Colour — {selectedColor?.name ?? 'Choose one'}
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedColor(c)}
                title={c.name}
                className={
                  'h-8 w-8 rounded-full border-2 transition-all ' +
                  (selectedColor?.name === c.name
                    ? 'border-wine scale-110 shadow-md'
                    : 'border-sand hover:border-brown')
                }
                style={{
                  background: c.hex2
                    ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)`
                    : c.hex,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      <button onClick={placeOrder} disabled={busy} className="btn-primary mt-5 w-full">
        {busy ? 'One moment…' : 'Place order'}
      </button>
      {error ? <p className="mt-3 text-sm text-wine">{error}</p> : null}
      <p className="mt-3 text-center text-xs leading-relaxed text-brown">
        No card details here. You will get an order number and how to pay.
      </p>
    </div>
  );
}
