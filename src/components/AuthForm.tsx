'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthForm({ mode, next }: { mode: 'login' | 'signup'; next: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const body = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    };
    try {
      const res = await fetch('/api/auth/' + mode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      router.push(data.role === 'ADMIN' && next === '/library' ? '/admin' : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  const isSignup = mode === 'signup';
  const otherHref = (isSignup ? '/login' : '/signup') + (next ? '?next=' + encodeURIComponent(next) : '');

  return (
    <form onSubmit={onSubmit} className="card w-full max-w-md p-8">
      <h1 className="font-display text-3xl text-wine">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mt-2 text-sm leading-relaxed text-brown">
        {isSignup
          ? 'Your purchases are saved here, so you can download them again any time.'
          : 'Sign in to reach your library and your orders.'}
      </p>

      <div className="mt-7 space-y-4">
        {isSignup ? (
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input id="name" name="name" required autoComplete="name" className="input" placeholder="Sara" />
          </div>
        ) : null}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            className="input"
            placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
          />
        </div>
      </div>

      {error ? <p className="mt-4 rounded-lg bg-mauve-pale px-3 py-2 text-sm text-wine">{error}</p> : null}

      <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
        {busy ? 'One moment…' : isSignup ? 'Create account' : 'Sign in'}
      </button>

      <p className="mt-5 text-center text-sm text-brown">
        {isSignup ? 'Already have an account? ' : 'New here? '}
        <Link href={otherHref} className="text-wine link-underline">
          {isSignup ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
}
