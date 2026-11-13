'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M12 20.3l-1.3-1.2C6 14.9 3.2 12.3 3.2 9.1 3.2 6.6 5.2 4.6 7.7 4.6c1.4 0 2.8.7 3.7 1.8l.6.7.6-.7c.9-1.1 2.3-1.8 3.7-1.8 2.5 0 4.5 2 4.5 4.5 0 3.2-2.8 5.8-7.5 10l-1.3 1.2z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WishlistButton({
  templateId,
  initialSaved,
  signedIn,
  returnTo,
  variant = 'icon',
  refreshOnChange = false,
}: {
  templateId: string;
  initialSaved: boolean;
  signedIn: boolean;
  returnTo: string;
  variant?: 'icon' | 'full';
  refreshOnChange?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState('');

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!signedIn) {
      router.push('/signup?next=' + encodeURIComponent(returnTo) + '&why=save');
      return;
    }

    const next = !saved;
    setSaved(next);
    setBusy(true);
    setHint('');

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, action: next ? 'add' : 'remove' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save that.');
      if (refreshOnChange) router.refresh();
    } catch (err) {
      setSaved(!next);
      setHint(err instanceof Error ? err.message : 'Could not save that.');
    } finally {
      setBusy(false);
    }
  }

  const label = !signedIn
    ? 'Save for later'
    : saved
      ? 'Saved to your wishlist'
      : 'Save for later';

  if (variant === 'full') {
    return (
      <div>
        <button
          onClick={toggle}
          disabled={busy}
          aria-pressed={saved}
          className={
            'btn w-full border ' +
            (saved
              ? 'border-wine bg-mauve-pale text-wine hover:bg-mauve/30'
              : 'border-sand text-cocoa hover:border-brown hover:bg-sand-pale')
          }
        >
          <Heart filled={saved} />
          {saved ? 'Saved for later' : 'Save for later'}
        </button>
        {!signedIn ? (
          <p className="mt-2 text-center text-xs text-brown">Sign in to save it.</p>
        ) : null}
        {hint ? <p className="mt-2 text-center text-xs text-wine">{hint}</p> : null}
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={label}
      title={label}
      aria-pressed={saved}
      className={
        'absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition ' +
        (saved
          ? 'bg-wine text-sand-light shadow-card'
          : 'bg-cream/90 text-brown hover:bg-surface hover:text-wine')
      }
    >
      <Heart filled={saved} />
    </button>
  );
}
