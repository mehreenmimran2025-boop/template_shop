'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Country } from '@/lib/countries';
import { chooseCountry } from '@/app/actions';

export default function CountryPicker({
  countries,
  value,
  variant = 'full',
}: {
  countries: Country[];
  value: string;
  variant?: 'full' | 'compact';
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(code: string) {
    // The server sets the cookie and revalidates, so every price on the page follows.
    startTransition(async () => {
      await chooseCountry(code);
      router.refresh();
    });
  }

  const selected = countries.find((c) => c.code === value) ?? countries[0];

  if (variant === 'compact') {
    return (
      <label className="relative hidden items-center sm:flex">
        <span className="sr-only">Show prices for</span>
        <select
          value={selected.code}
          onChange={(e) => choose(e.target.value)}
          disabled={pending}
          className="cursor-pointer appearance-none rounded-full border border-sand bg-surface/70 py-2 pl-3 pr-7 text-xs font-semibold text-cocoa transition hover:border-brown focus:outline-none focus:ring-2 focus:ring-wine/15"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.currency}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 text-[10px] text-brown">▾</span>
      </label>
    );
  }

  return (
    <div>
      <label className="label" htmlFor="country-picker">Prices shown for</label>
      <select
        id="country-picker"
        value={selected.code}
        onChange={(e) => choose(e.target.value)}
        disabled={pending}
        className="input cursor-pointer sm:max-w-xs"
      >
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name} ({c.currency})
          </option>
        ))}
      </select>
    </div>
  );
}
