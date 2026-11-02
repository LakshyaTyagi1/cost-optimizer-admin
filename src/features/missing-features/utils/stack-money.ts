import { defaultDisplayToBaseCurrencyRate } from "@/features/assessments/utils/currency";
import type { PriceVariant } from "@/features/missing-features/utils/stack-selection-view";

/**
 * Amounts in the technology stack view are shown in one display currency at a time.
 *
 * AED is the canonical base currency and USD is the other display currency. The rate is
 * the backend's configured one, "AED per 1 USD" (`displayToBaseCurrencyRate`), so a USD
 * amount times the rate is AED and an AED amount divided by the rate is USD. Every
 * conversion starts from the amount exactly as the customer entered it, so nothing is
 * converted twice. The only rate in this file is the existing fallback, used until the
 * configured one has loaded.
 */

export type DisplayCurrency = "AED" | "USD";

export const displayCurrencies: readonly DisplayCurrency[] = ["AED", "USD"];

export const fallbackDisplayToBaseCurrencyRate = defaultDisplayToBaseCurrencyRate;

export type MoneyView = {
  /** The currency the shown number is in; the entered one when it could not be converted. */
  currency: string;
  /** True when the shown number differs from what the customer entered. */
  converted: boolean;
  /** What the customer entered, such as "120 USD". */
  original: string;
  /** The number to show, such as "440.7". */
  text: string;
};

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function isDisplayCurrency(value: string): value is DisplayCurrency {
  return value === "AED" || value === "USD";
}

/** A stored amount is a plain decimal string; anything else is not shown as a number. */
function parseAmount(value: string) {
  const normalized = value.trim().replace(/,/g, "");

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : null;
}

function convertAmount(amount: number, from: DisplayCurrency, to: DisplayCurrency, rate: number) {
  if (from === to) {
    return amount;
  }

  return from === "USD" ? amount * rate : amount / rate;
}

/**
 * One entered amount in the display currency. Returns null when there is no amount to
 * show. An amount in a currency other than AED or USD, or one that is not a plain number,
 * is shown as entered rather than guessed at.
 */
export function toMoneyView(
  amount: string,
  currency: string,
  display: DisplayCurrency,
  rate: number,
): MoneyView | null {
  const trimmed = amount.trim();

  if (!trimmed) {
    return null;
  }

  const code = currency.trim().toUpperCase();
  const original = code ? `${trimmed} ${code}` : trimmed;
  const parsed = parseAmount(trimmed);

  if (parsed === null || !isDisplayCurrency(code) || !(rate > 0)) {
    return { converted: false, currency: code, original, text: trimmed };
  }

  const value = convertAmount(parsed, code, display, rate);

  return {
    converted: code !== display,
    currency: display,
    original,
    text: numberFormat.format(value),
  };
}

export type MergedPrice = {
  count: number;
  /** Every amount, as entered, that was merged into this one. */
  originals: string[];
  view: MoneyView;
};

/**
 * The prices customers entered for one plan, in the display currency. Two amounts that
 * show the same number, such as 100 USD and its AED equivalent, are one entry with both
 * customer counts added.
 */
export function mergePrices(
  prices: PriceVariant[],
  display: DisplayCurrency,
  rate: number,
): MergedPrice[] {
  const merged = new Map<string, MergedPrice>();

  for (const price of prices) {
    const view = toMoneyView(price.amount, price.currency, display, rate);

    if (!view) {
      continue;
    }

    const key = `${view.currency}::${view.text}`;
    const entry = merged.get(key) ?? { count: 0, originals: [], view };

    entry.count += price.count;

    if (!entry.originals.includes(view.original)) {
      entry.originals.push(view.original);
    }

    merged.set(key, entry);
  }

  return Array.from(merged.values()).sort((first, second) => second.count - first.count);
}
