export function formatDate(dateValue?: string) {
  const date = new Date(dateValue || "");

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function sumMetric(values: string[]) {
  return values.reduce((sum, value) => {
    const numericValue = parseMetricNumber(value);

    return numericValue > 0 ? sum + numericValue : sum;
  }, 0);
}

export function formatBaseCurrency(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "--";
  }

  return `AED ${Math.round(amount).toLocaleString("en-US")}`;
}

export function formatCompactCurrencyMetric(metricValue: string) {
  const numericValue = parseMetricNumber(metricValue);

  if (numericValue < 0) {
    return metricValue || "--";
  }

  if (numericValue >= 1_000_000) {
    return `AED ${Math.round(numericValue / 100_000) / 10}m`;
  }

  if (numericValue >= 1_000) {
    return `AED ${Math.round(numericValue / 1_000)}k`;
  }

  return metricValue;
}

export function formatNullableCount(count: number | null) {
  return count === null ? "--" : String(count);
}

export function getPotentialDi(currentDigitizationIndex: string) {
  const currentScore = parseMetricNumber(currentDigitizationIndex);

  if (currentScore < 0) {
    return "75%";
  }

  return `${Math.min(95, Math.max(75, currentScore + 25))}%`;
}

export function formatNumberInput(inputNumber: number | undefined) {
  if (!Number.isFinite(inputNumber) || Number(inputNumber) <= 0) {
    return "";
  }

  const roundedValue = Math.round(Number(inputNumber) * 100) / 100;
  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : String(roundedValue).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatPercentValue(percentValue?: number) {
  const formattedValue = formatNumberInput(percentValue);

  return formattedValue ? `${formattedValue}%` : "--";
}

export function parseMetricNumber(metricValue: string) {
  const normalizedValue = String(metricValue || "").trim().toLowerCase();
  const numericValue = Number(normalizedValue.replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(numericValue)) {
    return -1;
  }

  if (normalizedValue.includes("m")) {
    return numericValue * 1_000_000;
  }

  if (normalizedValue.includes("k")) {
    return numericValue * 1_000;
  }

  return numericValue;
}
