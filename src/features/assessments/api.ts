import { fetchAdminApiResponse } from "@/lib/api/client";
import type {
  AdminAssessmentProcess,
  AdminAssessmentRow,
  AdminAssessmentStatus,
  AdminAssessmentsPayload,
} from "@/features/assessments/model";
export type {
  AdminAssessmentProcess,
  AdminAssessmentRow,
  AdminAssessmentStatus,
  AdminAssessmentsPayload,
} from "@/features/assessments/model";

type DashboardPayload = {
  pipelineByStatus?: AdminAssessmentStatus[];
  recentAssessments?: AdminAssessmentRow[];
  totalAssessments?: number;
};

const assessmentsDashboardPath = "/adm/cos-process-management/dashboard";

export async function fetchAdminAssessments(): Promise<AdminAssessmentsPayload> {
  const assessmentsResponse = await fetchAdminApiResponse<DashboardPayload>(assessmentsDashboardPath, {
    authErrorMessage: "Admin access token is required to load assessments",
    errorMessage: "Unable to load assessments",
    params: { limit: "250" },
  });

  const dashboardPayload = assessmentsResponse?.data ?? {};
  const assessments = Array.isArray(dashboardPayload.recentAssessments)
    ? dashboardPayload.recentAssessments.map((assessment) => {
        const processes = mapAssessmentProcesses(assessment.processes, assessment.id);
        const customProcesses = mapAssessmentProcesses(assessment.customProcesses, assessment.id);

        return {
          ...assessment,
          customProcesses: customProcesses.length
            ? customProcesses
            : processes.filter(isFrontendCustomAssessmentProcess),
          processes,
        };
      })
    : [];

  return {
    assessments,
    pipelineByStatus: Array.isArray(dashboardPayload.pipelineByStatus) ? dashboardPayload.pipelineByStatus : [],
    totalAssessments: Number(dashboardPayload.totalAssessments) || assessments.length,
  };
}

export async function fetchAdminAssessment(assessmentId: string): Promise<AdminAssessmentRow> {
  const normalizedAssessmentId = assessmentId.trim();

  if (!normalizedAssessmentId) {
    throw new Error("Assessment id is required");
  }

  const assessmentResponse = await fetchAdminApiResponse<AdminAssessmentRow>(
    `/adm/cos-process-management/assessments/${encodeURIComponent(normalizedAssessmentId)}`,
    {
      authErrorMessage: "Admin access token is required to load assessment details",
      errorMessage: "Unable to load assessment details",
    },
  );

  if (!assessmentResponse?.data) {
    throw new Error(assessmentResponse?.message || "Unable to load assessment details");
  }

  const assessment = assessmentResponse.data;
  const processes = mapAssessmentProcesses(assessment.processes, assessment.id);
  const customProcesses = mapAssessmentProcesses(assessment.customProcesses, assessment.id);

  return {
    ...assessment,
    customProcesses: customProcesses.length
      ? customProcesses
      : processes.filter(isFrontendCustomAssessmentProcess),
    processes,
  };
}

function mapAssessmentProcesses(
  processes: AdminAssessmentProcess[] | undefined,
  assessmentId: string,
) {
  return (processes ?? []).map((process) => ({
    ...process,
    assessmentId,
  }));
}

function isFrontendCustomAssessmentProcess(process: AdminAssessmentProcess) {
  return String(process.source || "").trim().toLowerCase() === "industry-domain-custom";
}
