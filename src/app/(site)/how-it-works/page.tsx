import Link from 'next/link';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'How it works' };

export default async function HowItWorksPage() {
  const s = await getSettings();

  const steps = [
    {
      title: 'Make an account',
      body: 'An email and a password. That is what keeps your templates saved for you.',
    },
    {
      title: 'Pick what you like',
      body: 'Open a template, look through the previews, then press Place order.',
    },
    {
      title: 'Pay when you are ready',
      body: s.paymentInstructions,
    },
    {
      title: 'I confirm it',
      body: 'I check the payment myself and open up your order — usually the same day.',
    },
    {
      title: 'It is yours',
      body: 'It lands in your library and stays there. Download it any time.',
    },
  ];

  return (
    <div className="container-x max-w-3xl py-16">
      <p className="eyebrow">How it works</p>
      <h1 className="mt-2 font-display text-5xl text-wine">Come in, have a look around</h1>
      <p className="mt-5 text-lg leading-relaxed text-brown">
        A small shop, run by one person. Take your time — nothing here is rushed.
      </p>

      <ol className="mt-12 space-y-9">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wine font-display text-lg text-sand-light">
              {i + 1}
            </span>
            <div>
              <h2 className="font-display text-2xl text-cocoa">{step.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-brown">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {s.aboutText ? (
        <div className="card mt-14 p-8">
          <h2 className="font-display text-2xl text-cocoa">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brown">{s.aboutText}</p>
        </div>
      ) : null}

      <div className="mt-14 rounded-xl2 border border-sand bg-sand-pale/60 p-8 text-center">
        <h2 className="font-display text-3xl text-wine">Shall we?</h2>
        <p className="mt-2 text-sm text-brown">Browsing is free.</p>
        <Link href="/templates" className="btn-primary mt-5">See the collection</Link>
      </div>
    </div>
  );
}
