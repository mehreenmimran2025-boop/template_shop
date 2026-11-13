import { cookies } from 'next/headers';
import { getSession } from './auth';
import { getSettings } from './settings';
import { getWishlistIds } from './wishlist';
import { COUNTRIES, COUNTRY_COOKIE, findCountry, getRate, makeFormatter } from './currency';

/** Everything a shop page needs: who is looking, where from, and what a price says to them. */
export async function getShopContext(options: { wishlist?: boolean } = {}) {
  const [settings, session] = await Promise.all([getSettings(), getSession()]);

  // Everyone sees the shop's chosen currency until they pick their own — no guessing by
  // location, so the price a first-time visitor sees is the same everywhere.
  const chosen = cookies().get(COUNTRY_COOKIE)?.value;
  const country =
    findCountry(chosen) ??
    findCountry(settings.defaultCountry) ??
    findCountry(settings.baseCountry) ??
    COUNTRIES[0];

  const rateInfo = await getRate(settings.baseCurrency, country.currency).catch(() => null);

  const price = makeFormatter({
    baseCurrency: settings.baseCurrency,
    baseSymbol: settings.currencySymbol,
    currency: country.currency,
    rate: rateInfo?.rate ?? null,
  });

  const wishlist = options.wishlist ? await getWishlistIds(session?.uid) : new Set<string>();

  return { settings, session, country, rateInfo, price, wishlist };
}
