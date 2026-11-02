"use client";

import { createContext, useContext, type ReactNode } from "react";

import { CurrencyIcon } from "@/components/ui/currency-icon/currency-icon";
import type { PriceVariant } from "@/features/missing-features/utils/stack-selection-view";
import {
  displayCurrencies,
  fallbackDisplayToBaseCurrencyRate,
  isDisplayCurrency,
  mergePrices,
  toMoneyView,
  type DisplayCurrency,
  type MoneyView,
} from "@/features/missing-features/utils/stack-money";

/**
 * The display currency of the technology stack view. Amounts default to AED, the base
 * currency, and the toggle shows them in USD. Every amount below reads the currency and
 * rate from here, so the whole view always agrees.
 */

type StackCurrencyValue = { currency: DisplayCurrency; rate: number };

const StackCurrencyContext = createContext<StackCurrencyValue>({
  currency: "AED",
  rate: fallbackDisplayToBaseCurrencyRate,
});

export function StackCurrencyProvider({
  children,
  currency,
  rate,
}: StackCurrencyValue & { children: ReactNode }) {
  return <StackCurrencyContext value={{ currency, rate }}>{children}</StackCurrencyContext>;
}

export function useStackCurrency() {
  return useContext(StackCurrencyContext);
}

const rateFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

/** An amount with its currency icon. The code is spoken to screen readers, never lost. */
function MoneyText({
  iconSize,
  originals,
  view,
}: {
  iconSize?: number;
  originals?: string[];
  view: MoneyView;
}) {
  const hasIcon = isDisplayCurrency(view.currency);
  const entered = view.converted ? (originals ?? [view.original]).join(" / ") : "";

  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap"
      title={entered ? `Entered as ${entered}` : undefined}
    >
      <CurrencyIcon currency={view.currency} size={iconSize} />
      <span>{view.text}</span>
      {view.currency ? (
        <span className={hasIcon ? "sr-only" : "text-[11px] text-[#86868B]"}>{view.currency}</span>
      ) : null}
    </span>
  );
}

/** One entered amount, in the display currency. Hovering a converted amount shows what was entered. */
export function Money({ amount, currency }: { amount: string; currency: string }) {
  const { currency: display, rate } = useStackCurrency();
  const view = toMoneyView(amount, currency, display, rate);

  return view ? <MoneyText view={view} /> : <span className="text-[#86868B]">—</span>;
}

/**
 * The prices customers entered for a plan, in the display currency, with how many chose
 * each. The `hero` size makes the most-chosen price the headline of a plan card.
 */
export function PriceList({
  label,
  prices,
  size = "default",
}: {
  label: string;
  prices: PriceVariant[];
  size?: "default" | "hero";
}) {
  const { currency, rate } = useStackCurrency();
  const merged = mergePrices(prices, currency, rate);

  if (merged.length === 0) {
    return <span className="text-[#86868B]">No price entered</span>;
  }

  return (
    <ul aria-label={label} className="flex flex-col gap-0.5">
      {merged.map((price, index) => {
        const isHero = size === "hero" && index === 0;

        return (
          <li
            key={`${price.view.currency}-${price.view.text}`}
            className={`text-[#1D1D1F] ${isHero ? "text-[20px] leading-7" : ""}`}
          >
            <span className="font-semibold">
              <MoneyText
                iconSize={isHero ? 16 : undefined}
                originals={price.originals}
                view={price.view}
              />
            </span>
            {merged.length > 1 ? (
              <span className="text-[11px] text-[#86868B]">
                {" "}
                · {price.count} customer{price.count === 1 ? "" : "s"}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Switches every amount between AED and USD, and says which rate the conversion uses. The
 * control looks and reads like the currency toggle customers use in the cost optimizer.
 */
export function CurrencyToggle({
  currency,
  isFallbackRate,
  onChange,
  rate,
}: {
  currency: DisplayCurrency;
  isFallbackRate: boolean;
  onChange: (currency: DisplayCurrency) => void;
  rate: number;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div
        role="group"
        aria-label="Display currency"
        className="grid h-9 grid-cols-2 rounded-lg border border-black/[0.08] bg-[#F5F5F7] p-0.5"
      >
        {displayCurrencies.map((code) => {
          const isSelected = currency === code;

          return (
            <button
              key={code}
              type="button"
              aria-label={`Show amounts in ${code}`}
              aria-pressed={isSelected}
              title={`Show amounts in ${code}`}
              onClick={() => onChange(code)}
              className={`inline-flex h-[30px] min-w-[58px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 text-[12px] leading-none font-semibold transition-colors focus:border-[#007AFF]/30 focus:outline-none ${
                isSelected
                  ? "bg-white text-black shadow-[0_1px_2px_-1px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.10)]"
                  : "text-[#86868B] hover:text-black"
              }`}
            >
              <CurrencyIcon currency={code} />
              {code}
            </button>
          );
        })}
      </div>
      <span className="text-[11px] text-[#86868B]">
        1 USD = {rateFormat.format(rate)} AED{isFallbackRate ? " (default rate)" : ""}
      </span>
    </div>
  );
}
