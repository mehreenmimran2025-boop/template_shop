'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-sand bg-sand-pale text-xs font-semibold text-cocoa transition hover:border-brown"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initials}
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-sand bg-surface py-1 shadow-lift">
          <div className="px-4 py-2.5 text-xs text-brown">
            Signed in as
            <br />
            <span className="font-semibold text-cocoa">{name}</span>
          </div>
          <div className="my-1 h-px bg-sand/60" />
          <Link href="/library" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-cocoa hover:bg-sand-pale">
            My library
          </Link>
          <Link href="/account" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-cocoa hover:bg-sand-pale">
            Account
          </Link>
          <button onClick={signOut} className="block w-full px-4 py-2 text-left text-sm text-wine hover:bg-mauve-pale">
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
