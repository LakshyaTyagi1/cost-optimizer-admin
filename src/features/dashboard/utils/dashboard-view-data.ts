import {
  pipelineStatuses,
  type DashboardCount,
  type DashboardPipelineStageWeight,
  type DashboardSummary,
  type DashboardTrendPoint,
  type DashboardValue,
  type PipelineStatus,
  type RecentAssessment,
} from "@/features/dashboard/model";
import type { DashboardData } from "@/features/dashboard/queries";

export type DashboardStat = {
  helper: string;
  label: string;
  tone: "neutral" | "blue" | "green";
  value: string;
};

export type DashboardPipelineConversion = {
  deals: string;
  label: string;
  percent: number;
};

export type DashboardViewData = {
  assessmentTrend: DashboardTrendPoint[];
  companySizeAxisMax: number;
  companySizeDistribution: DashboardValue[];
  companySizeTicks: number[];
  industryBreakdown: DashboardCount[];
  pipelineConversion: DashboardPipelineConversion[];
  selectedProcesses: DashboardValue[];
  selectedProcessesAxisMax: number;
  selectedProcessesTicks: number[];
  stats: DashboardStat[];
  statuses: PipelineStatus[];
  weightedPipelineStages: DashboardPipelineStageWeight[];
  weightedPipelineBaseCurrencyValue: number;
};

const companySizeBuckets = [
  { key: "1-50", label: "1–50\nemployees" },
  { key: "51-200", label: "51–200\nemployees" },
  { key: "201-1000", label: "201–1,000\nemployees" },
  { key: "1001-5000", label: "1,001–5,000\nemployees" },
  { key: "5001-20000", label: "5,001–20,000\nemployees" },
  { key: "20000-plus", label: "20,000+\nemployees" },
] as const;

type CompanySizeBucketKey = (typeof companySizeBuckets)[number]["key"];

const industryBreakdownBuckets = [
  { key: "banking", label: "Banking" },
  { key: "healthcare", label: "Healthcare" },
  { key: "insurance", label: "Insurance" },
  { key: "retail", label: "Retail" },
  { key: "public-sector", label: "Public Sector" },
  { key: "real-estate", label: "Real Estate" },
  { key: "automotive", label: "Automotive" },
] as const;

export function createDashboardViewData(dashboardData?: DashboardData): DashboardViewData {
  const statuses = getDashboardStatuses(dashboardData);
  const companySizeDistribution = getCompanySizeDistributionData(dashboardData);
  const companySizeAxisMax = getChartAxisMax(companySizeDistribution.map((companySizeEntry) => companySizeEntry.value), 8);
  const selectedProcesses = getSelectedProcessesData(dashboardData);
  const selectedProcessesAxisMax = getChartAxisMax(selectedProcesses.map((selectedProcessEntry) => selectedProcessEntry.value), 12);
  const weightedPipelineStages = getWeightedPipelineStages(dashboardData);

  return {
    assessmentTrend: getAssessmentTrendData(dashboardData),
    companySizeAxisMax,
    companySizeDistribution,
    companySizeTicks: createChartTicks(companySizeAxisMax),
    industryBreakdown: getIndustryBreakdownData(dashboardData),
    pipelineConversion: createPipelineConversion(statuses),
    selectedProcesses,
    selectedProcessesAxisMax,
    selectedProcessesTicks: createChartTicks(selectedProcessesAxisMax),
    stats: createDashboardStats({
      statuses,
      summary: dashboardData?.summary,
      totalAssessments: dashboardData?.totalAssessments ?? 0,
    }),
    statuses,
    weightedPipelineStages,
    weightedPipelineBaseCurrencyValue: getWeightedPipelineBaseCurrencyValue(dashboardData, weightedPipelineStages),
  };
}

function getDashboardStatuses(dashboardData?: DashboardData) {
  return dashboardData?.pipelineByStatus
    ? mergePipelineStatuses(dashboardData.pipelineByStatus)
    : pipelineStatuses;
}

function getIndustryBreakdownData(dashboardData?: DashboardData) {
  const normalizedIndustries = normalizeDashboardCounts(dashboardData?.industryBreakdown) ?? [];
  const countByIndustryKey = new Map<string, number>();
  const labelByIndustryKey = new Map<string, string>();

  normalizedIndustries.forEach((industryEntry) => {
    const industryKey = getIndustryBreakdownKey(industryEntry.label);

    if (!industryKey) {
      return;
    }

    countByIndustryKey.set(
      industryKey,
      (countByIndustryKey.get(industryKey) || 0) + industryEntry.count,
    );
    labelByIndustryKey.set(industryKey, labelByIndustryKey.get(industryKey) || industryEntry.label);
  });

  const knownIndustryKeys = new Set<string>(industryBreakdownBuckets.map((industry) => industry.key));
  const knownIndustries = industryBreakdownBuckets.map((industry) => ({
    label: industry.label,
    count: countByIndustryKey.get(industry.key) || 0,
  }));
  const extraIndustries = Array.from(countByIndustryKey.entries())
    .filter(([industryKey]) => !knownIndustryKeys.has(industryKey) && industryKey !== "not-specified")
    .map(([industryKey, count]) => ({
      label: labelByIndustryKey.get(industryKey) || industryKey,
      count,
    }));
  const notSpecifiedCount = countByIndustryKey.get("not-specified") || 0;
  const industries = [
    ...knownIndustries,
    ...extraIndustries,
    ...(notSpecifiedCount > 0 ? [{ label: "Not specified", count: notSpecifiedCount }] : []),
  ];

  return industries.sort(
    (firstIndustry, secondIndustry) =>
      secondIndustry.count - firstIndustry.count ||
      getIndustryBreakdownSortRank(firstIndustry.label) - getIndustryBreakdownSortRank(secondIndustry.label) ||
      firstIndustry.label.localeCompare(secondIndustry.label),
  );
}

function getAssessmentTrendData(dashboardData?: DashboardData) {
  return normalizeDashboardTrend(dashboardData?.assessmentTrend) ?? [];
}

function getIndustryBreakdownKey(label: string) {
  const industryKey = normalizeDashboardLabel(label)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!industryKey || industryKey === "unknown" || industryKey === "not-specified") {
    return "not-specified";
  }

  return industryKey;
}

function getIndustryBreakdownSortRank(label: string) {
  const industryKey = getIndustryBreakdownKey(label);
  const bucketIndex = industryBreakdownBuckets.findIndex((industry) => industry.key === industryKey);

  if (bucketIndex >= 0) {
    return bucketIndex;
  }

  return industryKey === "not-specified"
    ? industryBreakdownBuckets.length + 1
    : industryBreakdownBuckets.length;
}

function createDashboardStats({
  statuses,
  summary,
  totalAssessments,
}: {
  statuses: PipelineStatus[];
  summary?: DashboardSummary;
  totalAssessments: number;
}): DashboardStat[] {
  const activePipelineCount = isFiniteDashboardNumber(summary?.activePipelineCount)
    ? Math.round(summary.activePipelineCount)
    : statuses.reduce((sum, status) => {
        const key = normalizeStatusKey(status.key || status.label);

        return key === "closed-won" || key === "closed-lost"
          ? sum
          : sum + status.count;
      }, 0);
  const closedWonCount = isFiniteDashboardNumber(summary?.closedWonCount)
    ? Math.round(summary.closedWonCount)
    : getPipelineStatusCount(statuses, "Closed Won");
  const totalBaseCurrencyCost = getDashboardBaseCurrencyAmount(summary?.totalBaseCurrencyCost, summary?.totalCostAed);
  const totalBaseCurrencySavings = getDashboardBaseCurrencyAmount(summary?.totalBaseCurrencySavings, summary?.totalSavingsAed);
  const averageScore = isFiniteDashboardNumber(summary?.averageDigitizationIndex)
    ? Math.round(summary.averageDigitizationIndex)
    : null;

  return [
    {
      label: "Total Assessments",
      value: String(totalAssessments),
      helper: `${activePipelineCount} active in pipeline`,
      tone: "neutral",
    },
    {
      label: "Avg. Digitization Index",
      value: averageScore === null ? "--" : `${averageScore}%`,
      helper: "Across all submitted orgs",
      tone: "blue",
    },
    {
      label: "Total Cost Analysed",
      value: formatCompactBaseCurrency(totalBaseCurrencyCost),
      helper: "Combined annual process cost",
      tone: "neutral",
    },
    {
      label: "Total Potential Savings",
      value: formatCompactBaseCurrency(totalBaseCurrencySavings),
      helper: `${closedWonCount} deals closed-won`,
      tone: "green",
    },
  ];
}

function normalizeDashboardCounts(values?: DashboardCount[]) {
  if (!Array.isArray(values)) {
    return null;
  }

  return values
    .map((countEntry) => ({
      count: Math.max(0, Math.round(Number(countEntry.count) || 0)),
      label: normalizeDashboardLabel(countEntry.label),
    }))
    .filter((countEntry) => countEntry.label)
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label));
}

function normalizeDashboardValues(values?: DashboardValue[]) {
  if (!Array.isArray(values)) {
    return null;
  }

  return values
    .map((valueEntry) => {
      const rawValue =
        valueEntry.value ?? (valueEntry as DashboardValue & { count?: unknown }).count;

      return {
        label: normalizeDashboardLabel(valueEntry.label),
        value: Math.max(0, Math.round(Number(rawValue) || 0)),
      };
    })
    .filter((valueEntry) => valueEntry.label);
}

function normalizeDashboardTrend(values?: DashboardTrendPoint[]) {
  if (!Array.isArray(values)) {
    return null;
  }

  return values
    .map((trendEntry) => ({
      month: normalizeDashboardLabel(trendEntry.month),
      value: Math.max(0, Math.round(Number(trendEntry.value) || 0)),
    }))
    .filter((trendEntry) => trendEntry.month);
}

function createPipelineConversion(statuses: PipelineStatus[]) {
  const activeWonStatuses = statuses.filter((status) => {
    const key = normalizeStatusKey(status.key || status.label);

    return key !== "closed-lost";
  });
  const totalActiveWon = activeWonStatuses.reduce((sum, status) => sum + status.count, 0);

  return activeWonStatuses.map((status) => ({
    label: status.label,
    percent: totalActiveWon > 0 ? Math.round((status.count / totalActiveWon) * 100) : 0,
    deals: `${status.count} deals`,
  }));
}

function getCompanySizeDistributionData(dashboardData?: DashboardData) {
  const valueByBucket = new Map<CompanySizeBucketKey, number>(
    companySizeBuckets.map((bucket) => [bucket.key, 0]),
  );

  normalizeDashboardValues(dashboardData?.companySizeDistribution)?.forEach((companySizeEntry) => {
    const bucketKey = getCompanySizeBucketKey(companySizeEntry.label);

    if (!bucketKey) {
      return;
    }

    valueByBucket.set(bucketKey, (valueByBucket.get(bucketKey) || 0) + companySizeEntry.value);
  });

  return companySizeBuckets.map((bucket) => ({
    label: bucket.label,
    value: valueByBucket.get(bucket.key) || 0,
  }));
}

function getCompanySizeBucketKey(label: string): CompanySizeBucketKey | null {
  const normalizedLabel = label
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\bemployees?\b/g, "")
    .replace(/\bftes?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (
    !normalizedLabel ||
    normalizedLabel === "--" ||
    normalizedLabel.includes("not specified") ||
    normalizedLabel.includes("unknown")
  ) {
    return null;
  }

  const numbers = normalizedLabel
    .match(/\d[\d,]*/g)
    ?.map((value) => Number(value.replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));

  if (!numbers?.length) {
    return null;
  }

  const lowerBound = numbers[0];
  const upperBound = numbers[1];
  const isOpenEnded = normalizedLabel.includes("+");

  if (isOpenEnded) {
    if (lowerBound >= 20000) {
      return "20000-plus";
    }

    if (lowerBound >= 5001) {
      return "5001-20000";
    }
  }

  if (lowerBound >= 5001 || upperBound === 20000) {
    return "5001-20000";
  }

  if (lowerBound >= 1001 || upperBound === 5000) {
    return "1001-5000";
  }

  if (lowerBound >= 201 || upperBound === 1000) {
    return "201-1000";
  }

  if (lowerBound >= 51 || (upperBound !== undefined && upperBound > 50 && upperBound <= 250)) {
    return "51-200";
  }

  if (lowerBound >= 1 || upperBound === 50) {
    return "1-50";
  }

  return null;
}

function getSelectedProcessesData(dashboardData?: DashboardData) {
  return (
    normalizeDashboardValues(dashboardData?.selectedProcesses)?.map((selectedProcessEntry) => ({
      ...selectedProcessEntry,
      label: wrapChartLabel(selectedProcessEntry.label, 30),
    })) ?? []
  );
}

function getWeightedPipelineStages(dashboardData?: DashboardData) {
  return normalizeDashboardPipelineStages(dashboardData?.pipelineStageWeights) ?? [];
}

function getWeightedPipelineBaseCurrencyValue(
  dashboardData: DashboardData | undefined,
  weightedPipelineStages: DashboardPipelineStageWeight[],
) {
  const summaryBaseCurrencyValue = getDashboardBaseCurrencyAmount(
    dashboardData?.summary?.weightedPipelineBaseCurrencyValue,
    dashboardData?.summary?.weightedPipelineValueAed,
  );

  if (summaryBaseCurrencyValue > 0) {
    return summaryBaseCurrencyValue;
  }

  return weightedPipelineStages.reduce(
    (sum, stage) => sum + getDashboardBaseCurrencyAmount(stage.baseCurrencyValue, stage.valueAed),
    0,
  );
}

function normalizeDashboardPipelineStages(values?: DashboardPipelineStageWeight[]) {
  if (!Array.isArray(values)) {
    return null;
  }

  return values
    .map((pipelineStage) => {
      const baseCurrencyValue = getDashboardBaseCurrencyAmount(pipelineStage.baseCurrencyValue, pipelineStage.valueAed);

      return {
        baseCurrencyValue,
        count: Math.max(0, Math.round(Number(pipelineStage.count) || 0)),
        key: normalizeStatusKey(pipelineStage.key || pipelineStage.label),
        label: normalizeDashboardLabel(pipelineStage.label),
        valueAed: baseCurrencyValue,
        weightPercent: Math.max(0, Math.round(Number(pipelineStage.weightPercent) || 0)),
      };
    })
    .filter((pipelineStage) => pipelineStage.label);
}

function getDashboardBaseCurrencyAmount(primaryValue: unknown, fallbackValue?: unknown) {
  const primaryAmount = Number(primaryValue);

  if (Number.isFinite(primaryAmount) && primaryAmount > 0) {
    return Math.max(0, Math.round(primaryAmount));
  }

  const fallbackAmount = Number(fallbackValue);
  return Number.isFinite(fallbackAmount) && fallbackAmount > 0
    ? Math.max(0, Math.round(fallbackAmount))
    : 0;
}
function isFiniteDashboardNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getPipelineStatusCount(statuses: PipelineStatus[], label: string) {
  const normalizedLabel = normalizeStatusLabel(label);
  const normalizedKey = normalizeStatusKey(label);
  const status = statuses.find(
    (item) =>
      normalizeStatusLabel(item.label) === normalizedLabel ||
      normalizeStatusKey(item.key || "") === normalizedKey,
  );

  return status?.count || 0;
}

function mergePipelineStatuses(fetchedStatuses: PipelineStatus[]) {
  const fetchedStatusByKey = new Map<string, PipelineStatus>();

  fetchedStatuses.forEach((status) => {
    if (status.key) {
      fetchedStatusByKey.set(normalizeStatusKey(status.key), status);
      return;
    }

    fetchedStatusByKey.set(normalizeStatusLabel(status.label), status);
  });

  return pipelineStatuses.map((status) => {
    const fetchedStatus =
      fetchedStatusByKey.get(normalizeStatusKey(status.key || "")) ||
      fetchedStatusByKey.get(normalizeStatusLabel(status.label));

    return {
      ...status,
      count: Number(fetchedStatus?.count) || 0,
      tone: fetchedStatus?.tone || status.tone,
    };
  });
}

export function formatCompactBaseCurrency(baseCurrencyAmount: number) {
  const roundedBaseCurrencyAmount = Math.round(Number(baseCurrencyAmount) || 0);

  if (roundedBaseCurrencyAmount <= 0) {
    return "AED 0";
  }

  if (roundedBaseCurrencyAmount >= 1_000_000) {
    return `AED ${formatCompactNumber(roundedBaseCurrencyAmount / 1_000_000)}M`;
  }

  if (roundedBaseCurrencyAmount >= 1_000) {
    return `AED ${formatCompactNumber(roundedBaseCurrencyAmount / 1_000)}K`;
  }

  return `AED ${roundedBaseCurrencyAmount.toLocaleString("en-US")}`;
}

function formatCompactNumber(value: number) {
  return value >= 10
    ? Math.round(value).toLocaleString("en-US")
    : value.toFixed(1).replace(/\.0$/, "");
}

function getChartAxisMax(values: number[], minimumMax = 4) {
  const maxValue = Math.max(1, ...values);

  return Math.max(minimumMax, Math.ceil(maxValue / 4) * 4);
}

function createChartTicks(maxValue: number) {
  return Array.from({ length: 5 }, (_, index) => Math.round((maxValue / 4) * index));
}

export function normalizeDashboardLabel(value?: string) {
  const normalizedValue = String(value || "").trim().replace(/\s+/g, " ");

  return normalizedValue === "--" ? "" : normalizedValue;
}

function wrapChartLabel(label: string, maxLineLength: number) {
  if (label.length <= maxLineLength) {
    return label;
  }

  const words = label.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLineLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 2).join("\n");
}

export function normalizeStatusKey(value: string) {
  return value.trim().toLowerCase().replace(/_+/g, "-").replace(/\s+/g, "-");
}

function normalizeStatusLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getRecentAssessmentHighlightHref(assessment: RecentAssessment) {
  const contactEmail = getContactEmail(assessment.contact);
  const highlightKey = getRouteSlug(
    contactEmail || `${assessment.company}-${assessment.contact}` || assessment.id,
  );

  return highlightKey
    ? `/assessments?assessment=${encodeURIComponent(highlightKey)}`
    : "/assessments";
}

function getContactEmail(value: string) {
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

function getRouteSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function formatRecentAssessmentUpdatedAt(assessment: RecentAssessment) {
  const date = new Date(assessment.updatedAt || assessment.createdAt || "");

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hour12: true,
    minute: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/\b(am|pm)\b/i, (value) => value.toUpperCase());
}
