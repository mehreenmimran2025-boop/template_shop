'use client';

import { useState } from 'react';

export default function PasswordForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: String(data.get('currentPassword') ?? ''),
          newPassword: String(data.get('newPassword') ?? ''),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not change the password.');
      setMessage({ kind: 'ok', text: 'Password updated.' });
      form.reset();
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-6">
      <h2 className="font-display text-2xl text-cocoa">Change password</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" name="currentPassword" type="password" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="newPassword">New password</label>
          <input id="newPassword" name="newPassword" type="password" required minLength={6} className="input" />
        </div>
      </div>
      {message ? (
        <p className={'mt-4 text-sm ' + (message.kind === 'ok' ? 'text-olive' : 'text-wine')}>{message.text}</p>
      ) : null}
      <button type="submit" disabled={busy} className="btn-primary mt-5">
        {busy ? 'Saving…' : 'Update password'}
      </button>
    </form>
  );
}
