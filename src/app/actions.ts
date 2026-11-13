'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { COUNTRY_COOKIE, findCountry } from '@/lib/countries';

/** Remembers which country a visitor is browsing from, so prices follow them. */
export async function chooseCountry(code: string) {
  const country = findCountry(code);
  if (!country) return { ok: false };

  cookies().set(COUNTRY_COOKIE, country.code, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  revalidatePath('/', 'layout');
  return { ok: true, code: country.code };
}
