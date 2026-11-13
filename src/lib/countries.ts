export const COUNTRY_COOKIE = 'ts_country';

export type Country = { code: string; name: string; currency: string };

/** Country → the currency people there actually pay in. */
export const COUNTRIES: Country[] = [
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
  { code: 'QA', name: 'Qatar', currency: 'QAR' },
  { code: 'KW', name: 'Kuwait', currency: 'KWD' },
  { code: 'BH', name: 'Bahrain', currency: 'BHD' },
  { code: 'OM', name: 'Oman', currency: 'OMR' },
  { code: 'JO', name: 'Jordan', currency: 'JOD' },
  { code: 'LB', name: 'Lebanon', currency: 'LBP' },
  { code: 'EG', name: 'Egypt', currency: 'EGP' },
  { code: 'MA', name: 'Morocco', currency: 'MAD' },
  { code: 'TR', name: 'Türkiye', currency: 'TRY' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT' },
  { code: 'LK', name: 'Sri Lanka', currency: 'LKR' },
  { code: 'NP', name: 'Nepal', currency: 'NPR' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
  { code: 'PH', name: 'Philippines', currency: 'PHP' },
  { code: 'TH', name: 'Thailand', currency: 'THB' },
  { code: 'VN', name: 'Vietnam', currency: 'VND' },
  { code: 'CN', name: 'China', currency: 'CNY' },
  { code: 'JP', name: 'Japan', currency: 'JPY' },
  { code: 'KR', name: 'South Korea', currency: 'KRW' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'IE', name: 'Ireland', currency: 'EUR' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'ES', name: 'Spain', currency: 'EUR' },
  { code: 'IT', name: 'Italy', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR' },
  { code: 'SE', name: 'Sweden', currency: 'SEK' },
  { code: 'NO', name: 'Norway', currency: 'NOK' },
  { code: 'DK', name: 'Denmark', currency: 'DKK' },
  { code: 'PL', name: 'Poland', currency: 'PLN' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF' },
  { code: 'RU', name: 'Russia', currency: 'RUB' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'MX', name: 'Mexico', currency: 'MXN' },
  { code: 'BR', name: 'Brazil', currency: 'BRL' },
  { code: 'AR', name: 'Argentina', currency: 'ARS' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'KE', name: 'Kenya', currency: 'KES' },
];

export function findCountry(code?: string | null): Country | null {
  if (!code) return null;
  return COUNTRIES.find((c) => c.code === code.toUpperCase()) ?? null;
}


/** Currencies whose smallest unit is the unit itself — no decimals. */
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'ISK']);

export function formatCurrency(amount: number, code: string) {
  const zeroDecimal = ZERO_DECIMAL.has(code);
  const digits = zeroDecimal || Number.isInteger(amount) ? 0 : 2;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return code + ' ' + amount.toFixed(digits);
  }
}

export type PriceLabel = {
  /** The shop's own price — what the buyer actually transfers. */
  base: string;
  /** Same price in the visitor's currency, or null when that is the shop's own. */
  converted: string | null;
  /** What to show large: the visitor's currency when we can, otherwise the shop's. */
  main: string;
  /** The small line under `main`, when the two differ. */
  note: string | null;
};

export function makeFormatter(opts: {
  baseCurrency: string;
  baseSymbol: string;
  currency: string;
  rate: number | null;
}) {
  const { baseCurrency, baseSymbol, currency, rate } = opts;
  const symbol = baseSymbol.trim();

  return function price(cents: number): PriceLabel {
    const amount = cents / 100;
    const base =
      symbol && symbol !== baseCurrency
        ? symbol +
          ' ' +
          amount.toLocaleString('en-US', {
            minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
          })
        : formatCurrency(amount, baseCurrency);

    if (!rate || currency === baseCurrency) {
      return { base, converted: null, main: base, note: null };
    }

    const converted = formatCurrency(amount * rate, currency);
    return { base, converted, main: converted, note: base };
  };
}
