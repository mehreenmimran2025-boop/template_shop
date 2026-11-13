'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function ContactBox({
  storeName,
  replyTo,
  defaultName = '',
  defaultEmail = '',
}: {
  storeName: string;
  replyTo: string;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          body: String(data.get('body') ?? ''),
          page: pathname,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not send that.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-wine px-5 py-3 text-sm font-medium text-sand-light shadow-lift transition hover:bg-wine-deep"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
          <path
            d="M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M3.5 7l8.5 6 8.5-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {open ? 'Close' : 'Email me'}
      </button>

      {open ? (
        <div className="fixed bottom-20 right-5 z-50 w-[min(23rem,calc(100vw-2.5rem))] overflow-hidden rounded-xl2 border border-sand bg-surface shadow-lift">
          <div className="bg-wine px-5 py-4 text-sand-light">
            <p className="font-display text-xl">Say hello</p>
            <p className="mt-0.5 text-xs text-sand/80">Ask me anything — it comes straight to me.</p>
          </div>

          {sent ? (
            <div className="p-6 text-center">
              <p className="font-display text-2xl text-olive">Thank you</p>
              <p className="mt-2 text-sm leading-relaxed text-brown">I will reply by email soon.</p>
              <button
                onClick={() => {
                  setSent(false);
                  setOpen(false);
                }}
                className="btn-ghost btn-sm mt-5"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3 p-5">
              <div>
                <label className="label" htmlFor="contact-name">Your name</label>
                <input id="contact-name" name="name" required defaultValue={defaultName} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="contact-email">Your email</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={defaultEmail}
                  className="input"
                  placeholder="so I can reply"
                />
              </div>
              <div>
                <label className="label" htmlFor="contact-body">Message</label>
                <textarea
                  id="contact-body"
                  name="body"
                  required
                  rows={4}
                  className="textarea min-h-[90px]"
                  placeholder="Ask me anything…"
                />
              </div>

              {error ? <p className="rounded-lg bg-mauve-pale px-3 py-2 text-xs text-wine">{error}</p> : null}

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? 'Sending…' : 'Send message'}
              </button>

              {replyTo ? (
                <p className="text-center text-xs text-brown">
                  Or write to{' '}
                  <a href={'mailto:' + replyTo} className="link-underline text-wine">
                    {replyTo}
                  </a>
                </p>
              ) : null}
            </form>
          )}
        </div>
      ) : null}
    </>
  );
}
