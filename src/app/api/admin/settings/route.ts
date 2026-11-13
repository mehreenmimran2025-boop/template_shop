import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { adminGuard } from '@/lib/admin';
import { findCountry, refreshRates } from '@/lib/currency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FIELDS = [
  'storeName',
  'tagline',
  'heroHeadline',
  'heroSub',
  'aboutText',
  'paymentInstructions',
  'paymentDetails',
  'contactEmail',
  'whatsapp',
  'instagram',
  'inboxEmail',
] as const;

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const data: Record<string, string> = {};
  for (const field of FIELDS) {
    if (typeof body[field] === 'string') data[field] = body[field].slice(0, 2000);
  }
  if (data.storeName !== undefined && data.storeName.trim() === '') {
    return NextResponse.json({ error: 'The store needs a name.' }, { status: 400 });
  }

  // The country picks the currency the shop charges in — the two must never disagree,
  // or prices would be labelled in one currency and converted from another.
  const country = findCountry(typeof body.baseCountry === 'string' ? body.baseCountry : null);
  if (country) {
    data.baseCountry = country.code;
    data.baseCurrency = country.currency;
    data.currencySymbol = country.currency;
  }

  // What a first-time visitor sees before they pick their own country.
  const shopFront = findCountry(typeof body.defaultCountry === 'string' ? body.defaultCountry : null);
  if (shopFront) data.defaultCountry = shopFront.code;

  await prisma.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });

  if (country) await refreshRates(country.currency, true).catch(() => null);

  return NextResponse.json({ ok: true });
}
