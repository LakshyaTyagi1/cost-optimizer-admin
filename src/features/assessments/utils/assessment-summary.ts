import type {
  AdminAssessmentProcess,
  AdminAssessmentRow,
} from "@/features/assessments/model";
import type {
  AssessmentSummary,
  SortDirection,
  SortKey,
} from "@/features/assessments/view-model";
import { defaultDisplayToBaseCurrencyRate } from "@/features/assessments/utils/currency";
import {
  formatBaseCurrency,
  parseMetricNumber,
  sumMetric,
} from "@/features/assessments/utils/formatters";

type SavedCostCurrency = "AED" | "USD";

type SavedCurrencyCost = {
  amount: number;
  currency: SavedCostCurrency;
};

export function groupAssessmentsByUser(
  rows: AdminAssessmentRow[],
  sortKey: SortKey,
  sortDirection: SortDirection,
) {
  const groupedRows = new Map<string, AdminAssessmentRow[]>();

  rows.forEach((row) => {
    const key = getAssessmentGroupKey(row);
    const currentRows = groupedRows.get(key) ?? [];

    currentRows.push(row);
    groupedRows.set(key, currentRows);
  });

  return Array.from(groupedRows.entries())
    .map(([id, groupRows]) => createAssessmentSummary(id, groupRows))
    .sort((first, second) => compareAssessmentSummaries(first, second, sortKey, sortDirection));
}

export function createAssessmentSummary(id: string, rows: AdminAssessmentRow[]): AssessmentSummary {
  const sortedRows = [...rows].sort(
    (first, second) => getSortableTime(second) - getSortableTime(first),
  );
  const latestAssessment = sortedRows[0];
  const industries = getUniqueValues(
    rows.flatMap((row) => getAssessmentIndustries(row)),
  ).filter(
    (industry) => industry !== "--",
  );
  const processes = getUniqueProcesses(rows.flatMap((row) => row.processes ?? []));
  const customProcesses = getUniqueProcesses([
    ...rows.flatMap((row) => row.customProcesses ?? []),
    ...processes.filter(isFrontendCustomProcess),
  ]);
  const explicitProcessCount = rows.reduce((sum, row) => sum + (row.processCount ?? 0), 0);
  const processCount = processes.length || explicitProcessCount || null;

  return {
    assessments: sortedRows,
    company: latestAssessment?.company || "Cost optimization assessment",
    contact: latestAssessment?.contact || "--",
    cost: formatBaseCurrency(sumMetric(rows.map((row) => row.cost))),
    createdAt: getEarliestDate(rows.map((row) => row.createdAt || row.updatedAt)),
    currencyConversionRate: getAssessmentCurrencyConversionRate(rows),
    customProcesses,
    domain: getUniqueValues(rows.map((row) => row.domain)).join(", ") || "--",
    email: getUniqueValues(rows.map((row) => row.email))[0] || "",
    id,
    industry: getIndustrySummaryLabel(industries),
    industries,
    owner: latestAssessment?.owner || "--",
    preferences: getAssessmentPreferences(rows),
    processCount,
    processes,
    savings: formatBaseCurrency(sumMetric(rows.map((row) => row.savings))),
    score: getBestScore(rows.map((row) => row.score)),
    selectedStackTools: getUniqueValues(rows.flatMap((row) => row.selectedStackTools ?? [])),
    status: latestAssessment?.status || "Draft",
    statusKey: latestAssessment?.statusKey,
    totalCostInSavedCurrency: getAssessmentTotalCostInSavedCurrency(rows),
    updatedAt: latestAssessment?.updatedAt,
  };
}

function getAssessmentTotalCostInSavedCurrency(rows: AdminAssessmentRow[]) {
  const rowCosts = rows
    .map((row) => getSavedCurrencyCostFromMetric(row.totalCostInSavedCurrency))
    .filter((cost): cost is SavedCurrencyCost => cost !== null);

  if (rowCosts.length === rows.length && rowCosts.length > 0) {
    const currency = rowCosts[0].currency;

    if (rowCosts.every((cost) => cost.currency === currency)) {
      return formatSavedCurrencyAmount(
        rowCosts.reduce((sum, cost) => sum + cost.amount, 0),
        currency,
      );
    }
  }

  return formatBaseCurrency(sumMetric(rows.map((row) => row.cost)));
}

function getSavedCurrencyCostFromMetric(value?: string) {
  const currency = getSavedCurrencyFromMetric(value);
  const amount = parseMetricNumber(value || "");

  if (!currency || amount <= 0) {
    return null;
  }

  return {
    amount,
    currency,
  };
}

function getSavedCurrencyFromMetric(value?: string) {
  const normalizedValue = String(value || "").trim().toUpperCase();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.startsWith("$") || normalizedValue.includes("USD")) {
    return "USD";
  }

  if (normalizedValue.includes("AED")) {
    return "AED";
  }

  return null;
}

function formatSavedCurrencyAmount(amount: number, currency: SavedCostCurrency) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "--";
  }

  const formattedAmount = Math.round(amount).toLocaleString("en-US");

  return currency === "USD" ? `$${formattedAmount}` : `AED ${formattedAmount}`;
}

function getAssessmentCurrencyConversionRate(rows: AdminAssessmentRow[]) {
  const rate = rows
    .map((row) => Number(row.currencyConversionRate))
    .find((value) => Number.isFinite(value) && value > 0);

  return rate ?? defaultDisplayToBaseCurrencyRate;
}

function getAssessmentGroupKey(row: AdminAssessmentRow) {
  const stableUserKey = getContactEmail(row.contact) || `${row.company}-${row.contact}`;

  return getRouteSlug(stableUserKey);
}

export function getAssessmentDetailRouteId(assessment: AssessmentSummary) {
  const assessmentId = assessment.assessments[0]?.id || assessment.id;
  const userSlug = getRouteSlug(getContactName(assessment.contact));
  const companySlug = getRouteSlug(assessment.company);
  const readableSlug = [userSlug, companySlug].filter(Boolean).join("-");

  if (!assessmentId || !readableSlug) {
    return assessmentId;
  }

  return `${readableSlug}-${assessmentId}`;
}

export function isAssessmentHighlighted(assessment: AssessmentSummary, highlightKey: string) {
  if (!highlightKey) {
    return false;
  }

  return getAssessmentHighlightKeys(assessment).has(highlightKey);
}

function getAssessmentHighlightKeys(assessment: AssessmentSummary) {
  return new Set(
    [
      assessment.id,
      assessment.company,
      assessment.contact,
      assessment.email,
      getContactEmail(assessment.contact),
      ...assessment.assessments.flatMap((row) => [
        row.id,
        row.company,
        row.contact,
        row.email,
        getContactEmail(row.contact),
        getAssessmentGroupKey(row),
      ]),
    ]
      .map((value) => getRouteSlug(String(value || "")))
      .filter(Boolean),
  );
}

function getIndustrySummaryLabel(industries: string[]) {
  if (!industries.length) {
    return "--";
  }

  if (industries.length === 1) {
    return industries[0];
  }

  return `${industries[0]} +${industries.length - 1}`;
}

function getUniqueProcesses(processes: AdminAssessmentProcess[]) {
  const processByKey = new Map<string, AdminAssessmentProcess>();

  processes.forEach((process) => {
    const key = getProcessKey(process);

    if (key && !processByKey.has(key)) {
      processByKey.set(key, process);
    }
  });

  return Array.from(processByKey.values());
}

export function getProcessKey(process: AdminAssessmentProcess) {
  return process.id || process.processId || normalizeSearch(process.name || "");
}

export function isFrontendCustomProcess(process: AdminAssessmentProcess) {
  return String(process.source || "").trim().toLowerCase() === "industry-domain-custom";
}

function getAssessmentPreferences(rows: AdminAssessmentRow[]) {
  return rows.reduce<NonNullable<AdminAssessmentRow["preferences"]>>(
    (preferences, row) => ({
      aiPreference: preferences.aiPreference || row.preferences?.aiPreference,
      companySize: preferences.companySize || row.preferences?.companySize,
      deploymentPreference:
        preferences.deploymentPreference || row.preferences?.deploymentPreference,
      magicQuadrant: preferences.magicQuadrant || row.preferences?.magicQuadrant,
    }),
    {},
  );
}

export function getUniqueValues(values: Array<string | undefined>) {
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  );
}

function getBestScore(values: string[]) {
  const numericValues = values
    .map((value) => parseMetricNumber(value))
    .filter((value) => value >= 0);

  if (!numericValues.length) {
    return "--";
  }

  return `${Math.max(...numericValues)}%`;
}

export function getContactName(value: string) {
  return value.split(" - ")[0]?.trim() || "--";
}

export function getContactEmail(value: string) {
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

export function getRegion(value: string) {
  const parts = value.split(" - ").map((part) => part.trim()).filter(Boolean);
  const region = parts.find((part) => !part.includes("@") && part !== parts[0]);

  return region || "--";
}

function getEarliestDate(values: Array<string | undefined>) {
  const timestamps = values
    .map((value) => new Date(value || "").getTime())
    .filter(Number.isFinite);

  if (!timestamps.length) {
    return undefined;
  }

  return new Date(Math.min(...timestamps)).toISOString();
}

function compareAssessmentSummaries(
  first: AssessmentSummary,
  second: AssessmentSummary,
  sortKey: SortKey,
  direction: SortDirection,
) {
  const directionMultiplier = direction === "asc" ? 1 : -1;

  if (sortKey === "company") {
    return first.company.localeCompare(second.company) * directionMultiplier;
  }

  return (
    (parseMetricNumber(first[sortKey]) - parseMetricNumber(second[sortKey])) *
    directionMultiplier
  );
}

export function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getRouteSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getAssessmentUpdatedTime(assessment: AdminAssessmentRow) {
  const time = new Date(assessment.updatedAt || "").getTime();

  return Number.isFinite(time) ? time : null;
}

function getSortableTime(assessment: AdminAssessmentRow) {
  return getAssessmentUpdatedTime(assessment) ?? 0;
}

function getAssessmentIndustries(row: Pick<AdminAssessmentRow, "industry">) {
  return getUniqueValues(String(row.industry || "").split(",")).filter((industry) => industry !== "--");
}
