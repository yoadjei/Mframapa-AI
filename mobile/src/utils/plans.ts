// ─── Pricing plans ────────────────────────────────────────────────────────────
// Paystack supports USD, NGN, GHS, KES, and ZAR. USD must be explicitly enabled
// on the Paystack dashboard. We ship USD as the base and let the dashboard
// auto-convert if the customer pays in NGN/GHS/etc.

export type PlanId = 'pro_monthly' | 'pro_annual' | 'enterprise_monthly' | 'enterprise_annual';
export type Currency = 'USD' | 'NGN' | 'GHS' | 'KES' | 'ZAR';

/**
 * Channels Paystack will surface in the checkout for each currency.
 * USD = international cards only (mobile money requires local currency).
 * Source: https://paystack.com/docs/payments/payment-channels
 */
export type Channel = 'card' | 'mobile_money' | 'bank_transfer' | 'ussd' | 'qr' | 'bank';

export interface CurrencyInfo {
  flag: string;
  label: string;
  symbol: string;
  perUsd: number;       // Approximate units of this currency per 1 USD
  channels: Channel[];
}

// Rates are approximate as of mid-2026. For production, fetch live FX from a
// rates API and cache. Paystack will surcharge a small FX fee on cross-currency
// card payments — the customer sees the local amount on their statement.
export const CURRENCY_INFO: Record<Currency, CurrencyInfo> = {
  USD: { flag: '🇺🇸', label: 'US Dollar',         symbol: '$',   perUsd: 1,    channels: ['card'] },
  GHS: { flag: '🇬🇭', label: 'Ghanaian Cedi',     symbol: 'GH₵', perUsd: 14,   channels: ['card', 'mobile_money', 'bank_transfer'] },
  NGN: { flag: '🇳🇬', label: 'Nigerian Naira',    symbol: '₦',   perUsd: 1500, channels: ['card', 'bank_transfer', 'ussd', 'qr'] },
  KES: { flag: '🇰🇪', label: 'Kenyan Shilling',   symbol: 'KSh', perUsd: 130,  channels: ['card', 'mobile_money'] },
  ZAR: { flag: '🇿🇦', label: 'South African Rand', symbol: 'R',  perUsd: 18,   channels: ['card', 'bank_transfer'] },
};

export const SUPPORTED_CURRENCIES: Currency[] = ['GHS', 'NGN', 'KES', 'ZAR', 'USD'];

export function convertFromUsd(amountUsd: number, currency: Currency): number {
  return amountUsd * CURRENCY_INFO[currency].perUsd;
}

export function channelsFor(currency: Currency): Channel[] {
  return CURRENCY_INFO[currency].channels;
}

export interface PricingPlan {
  id: PlanId;
  label: string;            // Display name
  amountUsd: number;        // Charge amount in USD
  intervalDays: number;     // 30 for monthly, 365 for annual
  perUnit: string;          // "/month" or "/year"
  badge?: string;           // e.g. "Save 33%"
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'pro_monthly',
    label: 'Pro Monthly',
    amountUsd: 4.99,
    intervalDays: 30,
    perUnit: '/month',
  },
  {
    id: 'pro_annual',
    label: 'Pro Annual',
    amountUsd: 39.99,
    intervalDays: 365,
    perUnit: '/year',
    badge: 'Save 33%',
  },
  {
    id: 'enterprise_monthly',
    label: 'Enterprise Monthly',
    amountUsd: 29.99,
    intervalDays: 30,
    perUnit: '/month',
  },
  {
    id: 'enterprise_annual',
    label: 'Enterprise Annual',
    amountUsd: 249.99,
    intervalDays: 365,
    perUnit: '/year',
    badge: 'Save 30%',
  },
];

export function findPlan(id: PlanId): PricingPlan {
  const p = PRICING_PLANS.find((plan) => plan.id === id);
  if (!p) throw new Error(`Unknown plan: ${id}`);
  return p;
}

export function formatPrice(amountUsd: number, currency: Currency = 'USD'): string {
  const info = CURRENCY_INFO[currency];
  const amount = currency === 'USD' ? amountUsd : convertFromUsd(amountUsd, currency);
  // NGN amounts get whole-cedi truncation since cents are uncommon at retail.
  const decimals = amount >= 1000 ? 0 : 2;
  return `${info.symbol}${amount.toFixed(decimals)}`;
}

/**
 * Primary USD price followed by the local equivalent in parens, e.g.
 *   "$4.99 (GH₵69.86)"
 * Returns just the USD when local === 'USD'.
 */
export function formatPriceWithLocal(amountUsd: number, local: Currency): string {
  const usd = formatPrice(amountUsd, 'USD');
  if (local === 'USD') return usd;
  const localStr = formatPrice(amountUsd, local);
  return `${usd} (${localStr})`;
}

// Paystack expects amounts in the smallest currency unit (cents for USD,
// kobo for NGN, etc.). Always multiply by 100 before sending.
export function toPaystackAmount(amountUsd: number): number {
  return Math.round(amountUsd * 100);
}
