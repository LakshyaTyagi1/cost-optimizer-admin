import { fetchAdminApiResponse } from "@/lib/api/client";
import type {
  DashboardCount,
  DashboardSummary,
  DashboardTrendPoint,
  DashboardPipelineStageWeight,
  DashboardValue,
  PipelineStatus,
  RecentAssessment,
} from "@/features/dashboard/model";

type DashboardPayload = {
  assessmentTrend?: DashboardTrendPoint[];
  companySizeDistribution?: DashboardValue[];
  currencyConversionRate?: number;
  industryBreakdown?: DashboardCount[];
  pipelineByStatus?: PipelineStatus[];
  pipelineStageWeights?: DashboardPipelineStageWeight[];
  recentAssessments?: RecentAssessment[];
  selectedProcesses?: DashboardValue[];
  summary?: DashboardSummary;
  totalAssessments?: number;
};

const dashboardPath = "/adm/cos-process-management/dashboard";

export async function fetchDashboardData() {
  const dashboardResponse = await fetchAdminApiResponse<DashboardPayload>(dashboardPath, {
    authErrorMessage: "Admin access token is required to load real pipeline counts",
    errorMessage: "Unable to load dashboard data",
    params: { limit: "250", recentGroupBy: "user" },
  });

  return dashboardResponse?.data ?? {};
}

export async function fetchDashboardPipelineStatuses() {
  const dashboardData = await fetchDashboardData();

  return dashboardData.pipelineByStatus ?? [];
}

export async function fetchDashboardRecentAssessments() {
  const dashboardData = await fetchDashboardData();

  return dashboardData.recentAssessments ?? [];
}
