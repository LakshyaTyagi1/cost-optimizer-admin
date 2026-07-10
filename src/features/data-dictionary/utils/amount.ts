export const defaultDisplayToBaseCurrencyRate = 3.6725;

export function parseAmount(value: string) {
  const numericValue = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
}

export function formatProcessAmountInput(value: number) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatConversionRateInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return String(defaultDisplayToBaseCurrencyRate);
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export function getDisplayToBaseCurrencyRate(value: string) {
  const rate = parseAmount(value);
  return rate > 0 ? rate : defaultDisplayToBaseCurrencyRate;
}
