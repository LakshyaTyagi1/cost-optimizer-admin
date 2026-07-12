import { normalizeStatusKey } from "@/features/dashboard/utils/dashboard-view-data";

import { statusStyles } from "./dashboard-styles";

export function hasDashboardValueData(values: Array<{ value: number }>) {
  return values.some((valueEntry) => Number(valueEntry.value) > 0);
}

export function getStatusTone(status: string, statusKey = ""): keyof typeof statusStyles {
  const normalizedStatusKey = normalizeStatusKey(statusKey);

  if (normalizedStatusKey === "closed-won") {
    return "green";
  }

  if (normalizedStatusKey === "closed-lost") {
    return "red";
  }

  if (status === "Due Diligence" || status === "Results Ready") {
    return "blueLight";
  }

  if (status === "Processes In Progress") {
    return "gray";
  }

  return status === "Draft" ? "gray" : "blue";
}

export function getRecentAssessmentDateTime(assessment: { createdAt?: string; updatedAt?: string }) {
  const date = new Date(assessment.updatedAt || assessment.createdAt || "");

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load dashboard pipeline status";
}
