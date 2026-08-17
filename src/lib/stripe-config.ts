// Public Stripe + payments config. Safe to import from client and server.

// Publishable key — public by design. Stripe restricts it server-side.
export const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51TmvfpDRg2F7VdnHlyfNRWk0g2JlVASnnV903eTIS66DHBIZq5BfGCCeLjJvijLF61ca3GTgI5Aol25wmNOE7C4r00wRUzLvJo";

export const SERVICE_FEE_PERCENT = 5;

// Display-only FX rates → 1 unit of currency in USD.
// Replace with a live FX feed for production.
export const FX_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0064,
  KES: 0.0077,
  NGN: 0.00065,
  ZAR: 0.054,
  AED: 0.27,
  KRW: 0.00072,
  CAD: 0.73,
  AUD: 0.66,
  INR: 0.012,
  CNY: 0.14,
  CHF: 1.12,
  SEK: 0.094,
};

export function toUsdCents(amount: number, currency: string): number {
  const rate = FX_TO_USD[currency.toUpperCase()] ?? 1;
  return Math.round(amount * rate * 100);
}

export function fromUsdCents(cents: number): number {
  return cents / 100;
}

// Stripe Connect supported seller countries (Express). Minimal common set.
export const STRIPE_CONNECT_COUNTRIES = new Set<string>([
  "US","CA","GB","AU","NZ","SG","HK","JP",
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE",
  "IT","LV","LT","LU","MT","NL","NO","PL","PT","RO","SK","SI","ES","SE","CH",
  "AE","MX","BR","TH","MY","IN",
]);

export function calculateBreakdown(carPrice: number, currency: string) {
  const serviceFee = Math.round((carPrice * SERVICE_FEE_PERCENT) / 100 * 100) / 100;
  const total = Math.round((carPrice + serviceFee) * 100) / 100;
  const carPriceUsdCents = toUsdCents(carPrice, currency);
  const serviceFeeUsdCents = toUsdCents(serviceFee, currency);
  const totalUsdCents = toUsdCents(total, currency);
  return {
    carPrice,
    serviceFee,
    total,
    currency,
    carPriceUsdCents,
    serviceFeeUsdCents,
    totalUsdCents,
    feePercent: SERVICE_FEE_PERCENT,
    fxRate: FX_TO_USD[currency.toUpperCase()] ?? 1,
  };
}
