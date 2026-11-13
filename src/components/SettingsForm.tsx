'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES } from '@/lib/countries';

export type SettingsValues = {
  storeName: string;
  tagline: string;
  heroHeadline: string;
  heroSub: string;
  aboutText: string;
  paymentInstructions: string;
  paymentDetails: string;
  contactEmail: string;
  whatsapp: string;
  instagram: string;
  baseCountry: string;
  defaultCountry: string;
  inboxEmail: string;
};

export default function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const selectedCountry = COUNTRIES.find((c) => c.code === values.baseCountry);
  const visitorCountry = COUNTRIES.find((c) => c.code === values.defaultCountry);

  function set<K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save.');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-5 p-6">
        <h2 className="font-display text-2xl text-cocoa">Identity</h2>
        <div>
          <label className="label" htmlFor="storeName">Store name</label>
          <input
            id="storeName"
            className="input"
            value={values.storeName}
            onChange={(e) => set('storeName', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="tagline">Tagline</label>
          <input id="tagline" className="input" value={values.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="heroHeadline">Home page headline</label>
          <input
            id="heroHeadline"
            className="input"
            value={values.heroHeadline}
            onChange={(e) => set('heroHeadline', e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="heroSub">Home page paragraph</label>
          <textarea
            id="heroSub"
            className="textarea"
            value={values.heroSub}
            onChange={(e) => set('heroSub', e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="aboutText">About you (shown on How it works)</label>
          <textarea
            id="aboutText"
            className="textarea"
            value={values.aboutText}
            onChange={(e) => set('aboutText', e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="baseCountry">Where you sell from</label>
          <select
            id="baseCountry"
            className="input cursor-pointer"
            value={values.baseCountry}
            onChange={(e) => set('baseCountry', e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} — prices in {c.currency}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs leading-relaxed text-brown">
            You type prices in {selectedCountry ? selectedCountry.currency : 'this currency'}, and this is what buyers
            pay you.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="defaultCountry">What visitors see first</label>
          <select
            id="defaultCountry"
            className="input cursor-pointer"
            value={values.defaultCountry}
            onChange={(e) => set('defaultCountry', e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} — shown in {c.currency}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs leading-relaxed text-brown">
            Prices are converted into {visitorCountry ? visitorCountry.currency : 'this currency'} for anyone who has
            not picked their own country yet.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card space-y-5 p-6">
          <h2 className="font-display text-2xl text-cocoa">Payment</h2>
          <p className="text-sm text-brown">Buyers see this on their order page.</p>
          <div>
            <label className="label" htmlFor="paymentInstructions">Instructions</label>
            <textarea
              id="paymentInstructions"
              className="textarea"
              value={values.paymentInstructions}
              onChange={(e) => set('paymentInstructions', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="paymentDetails">Account details</label>
            <textarea
              id="paymentDetails"
              className="textarea font-mono text-xs"
              rows={5}
              value={values.paymentDetails}
              onChange={(e) => set('paymentDetails', e.target.value)}
            />
          </div>
        </div>

        <div className="card space-y-5 p-6">
          <h2 className="font-display text-2xl text-cocoa">Contact</h2>
          <div>
            <label className="label" htmlFor="inboxEmail">Where your messages should reach you</label>
            <input
              id="inboxEmail"
              type="email"
              className="input"
              value={values.inboxEmail}
              onChange={(e) => set('inboxEmail', e.target.value)}
              placeholder="you@example.com"
            />
            <p className="mt-1 text-xs leading-relaxed text-brown">
              Messages land in Admin → Messages. Reply opens your mail app.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="contactEmail">Public email (shown in the footer)</label>
            <input
              id="contactEmail"
              type="email"
              className="input"
              value={values.contactEmail}
              onChange={(e) => set('contactEmail', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="whatsapp">WhatsApp number (with country code)</label>
            <input
              id="whatsapp"
              className="input"
              value={values.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
              placeholder="9665XXXXXXXX"
            />
          </div>
          <div>
            <label className="label" htmlFor="instagram">Instagram handle</label>
            <input
              id="instagram"
              className="input"
              value={values.instagram}
              onChange={(e) => set('instagram', e.target.value)}
              placeholder="@yourhandle"
            />
          </div>
        </div>

        {error ? <p className="rounded-lg bg-mauve-pale px-4 py-3 text-sm text-wine">{error}</p> : null}

        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Saving…' : 'Save settings'}
          </button>
          {saved ? <span className="text-sm text-olive">Saved.</span> : null}
        </div>
      </div>
    </form>
  );
}
