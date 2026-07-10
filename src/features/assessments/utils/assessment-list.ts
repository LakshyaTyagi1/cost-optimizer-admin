import type { AdminAssessmentRow } from "@/features/assessments/model";
import type {
  SortDirection,
  SortKey,
} from "@/features/assessments/view-model";
import {
  getUniqueValues,
  normalizeSearch,
} from "@/features/assessments/utils/assessment-summary";
import { parseMetricNumber } from "@/features/assessments/utils/formatters";

export type AssessmentCatalogIndustry = {
  name: string;
};

export type AssessmentFilters = {
  fromDateFilter: string;
  industryFilter: string;
  minimumScoreFilter: string;
  searchQuery: string;
  statusFilter: string;
  toDateFilter: string;
};

type AssessmentListRow = {
  industries: string[];
  row: AdminAssessmentRow;
  searchableText: string;
  updatedTime: number | null;
};

export function createAssessmentListRows(assessmentRows: AdminAssessmentRow[]): AssessmentListRow[] {
  return assessmentRows.map((assessmentRow) => {
    const industries = getAssessmentIndustries(assessmentRow);

    return {
      industries,
      row: assessmentRow,
      searchableText: normalizeSearch(
        `${assessmentRow.company} ${assessmentRow.contact} ${industries.join(" ")} ${assessmentRow.status}`,
      ),
      updatedTime: getAssessmentUpdatedTime(assessmentRow),
    };
  });
}

export function filterAssessmentRows(
  assessmentRows: AssessmentListRow[],
  filters: AssessmentFilters,
  sortKey: SortKey,
  sortDirection: SortDirection,
) {
  const normalizedQuery = normalizeSearch(filters.searchQuery);
  const minimumScore = Number(filters.minimumScoreFilter);
  const hasMinimumScore =
    Number.isFinite(minimumScore) && filters.minimumScoreFilter.trim() !== "";
  const fromTime = getDateStartTime(filters.fromDateFilter);
  const toTime = getDateEndTime(filters.toDateFilter);

  return assessmentRows
    .filter(({ industries, row, searchableText, updatedTime }) => {
      if (normalizedQuery && !searchableText.includes(normalizedQuery)) {
        return false;
      }

      if (
        filters.industryFilter !== "all" &&
        !industries.includes(filters.industryFilter)
      ) {
        return false;
      }

      if (filters.statusFilter !== "all" && row.status !== filters.statusFilter) {
        return false;
      }

      if (hasMinimumScore && parseMetricNumber(row.score) < minimumScore) {
        return false;
      }

      if (fromTime !== null && (updatedTime === null || updatedTime < fromTime)) {
        return false;
      }

      if (toTime !== null && (updatedTime === null || updatedTime > toTime)) {
        return false;
      }

      return true;
    })
    .map(({ row }) => row)
    .sort((first, second) =>
      compareAssessments(first, second, sortKey, sortDirection),
    );
}

export function getAssessmentIndustryOptions(
  assessmentRows: AssessmentListRow[],
  catalogIndustries: AssessmentCatalogIndustry[],
) {
  return getUniqueValues([
    ...catalogIndustries.map((industry) => industry.name),
    ...assessmentRows.flatMap((row) => row.industries),
  ]).sort((first, second) => first.localeCompare(second));
}

export function getAssessmentStatusOptions(rows: AdminAssessmentRow[]) {
  return Array.from(
    new Set(rows.map((row) => row.status).filter((status) => status && status !== "--")),
  ).sort((first, second) => first.localeCompare(second));
}

function compareAssessments(
  first: AdminAssessmentRow,
  second: AdminAssessmentRow,
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

function getAssessmentIndustries(row: Pick<AdminAssessmentRow, "industry">) {
  return getUniqueValues(String(row.industry || "").split(",")).filter(
    (industry) => industry !== "--",
  );
}

function getDateStartTime(dateValue: string) {
  if (!dateValue) {
    return null;
  }

  const time = new Date(`${dateValue}T00:00:00`).getTime();

  return Number.isFinite(time) ? time : null;
}

function getDateEndTime(dateValue: string) {
  if (!dateValue) {
    return null;
  }

  const time = new Date(`${dateValue}T23:59:59`).getTime();

  return Number.isFinite(time) ? time : null;
}

function getAssessmentUpdatedTime(assessment: AdminAssessmentRow) {
  const time = new Date(assessment.updatedAt || "").getTime();

  return Number.isFinite(time) ? time : null;
}
