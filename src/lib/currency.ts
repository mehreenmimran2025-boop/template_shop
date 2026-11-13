import { prisma } from './db';
import { COUNTRIES } from './countries';

export * from './countries';

const MAX_AGE_HOURS = 12;
const FEED = 'https://open.er-api.com/v6/latest/';

export type RateInfo = {
  rate: number;
  fetchedAt: Date | null;
  stale: boolean;
};

/**
 * Rates for one base currency, cached in the database.
 * The feed (open.er-api.com) is free, needs no key and updates daily.
 * If it cannot be reached we keep serving the last known rates rather than guessing.
 */
export async function refreshRates(base: string, force = false) {
  const newest = await prisma.exchangeRate.findFirst({
    where: { base },
    orderBy: { fetchedAt: 'desc' },
  });

  const ageMs = newest ? Date.now() - newest.fetchedAt.getTime() : Infinity;
  if (!force && ageMs < MAX_AGE_HOURS * 60 * 60 * 1000) {
    return { updated: false, fetchedAt: newest?.fetchedAt ?? null, error: null as string | null };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(FEED + encodeURIComponent(base), {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);

    const json = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    if (!res.ok || json.result !== 'success' || !json.rates) throw new Error('Rate feed said no');

    const fetchedAt = new Date();
    const wanted = new Set(COUNTRIES.map((c) => c.currency));
    const rows = Object.entries(json.rates)
      .filter(([code]) => wanted.has(code))
      .map(([code, rate]) => ({ base, code, rate: Number(rate), fetchedAt }))
      .filter((row) => Number.isFinite(row.rate) && row.rate > 0);

    for (const row of rows) {
      await prisma.exchangeRate.upsert({
        where: { base_code: { base: row.base, code: row.code } },
        update: { rate: row.rate, fetchedAt },
        create: row,
      });
    }

    return { updated: true, fetchedAt, error: null as string | null };
  } catch (err) {
    return {
      updated: false,
      fetchedAt: newest?.fetchedAt ?? null,
      error: err instanceof Error ? err.message : 'Could not reach the rate feed',
    };
  }
}

/** How many units of `code` one unit of `base` buys. */
export async function getRate(base: string, code: string): Promise<RateInfo | null> {
  if (code === base) return { rate: 1, fetchedAt: null, stale: false };

  await refreshRates(base).catch(() => null);

  const row = await prisma.exchangeRate.findUnique({ where: { base_code: { base, code } } });
  if (!row) return null;

  const stale = Date.now() - row.fetchedAt.getTime() > 48 * 60 * 60 * 1000;
  return { rate: row.rate, fetchedAt: row.fetchedAt, stale };
}

