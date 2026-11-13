'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not sign in.');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card w-full max-w-md p-8">
      <h1 className="font-display text-3xl text-wine">Admin sign in</h1>
      <p className="mt-2 text-sm text-brown">Store owner access only.</p>

      <div className="mt-7 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" placeholder="••••••••" />
        </div>
      </div>

      {error ? <p className="mt-4 rounded-lg bg-mauve-pale px-3 py-2 text-sm text-wine">{error}</p> : null}

      <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
