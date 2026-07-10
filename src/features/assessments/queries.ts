import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  fetchAdminAssessment,
  fetchAdminAssessments,
  type AdminAssessmentRow,
  type AdminAssessmentsPayload,
} from "@/features/assessments/api";

export const assessmentsQueryKey = ["admin-assessments"] as const;

export function getAdminAssessmentQueryKey(assessmentId: string) {
  return [...assessmentsQueryKey, "detail", assessmentId] as const;
}

export type AdminAssessmentsQuery = UseQueryResult<AdminAssessmentsPayload, Error>;
export type AdminAssessmentQuery = UseQueryResult<AdminAssessmentRow, Error>;

export function useAdminAssessments(): AdminAssessmentsQuery {
  return useQuery<AdminAssessmentsPayload, Error>({
    queryKey: assessmentsQueryKey,
    queryFn: fetchAdminAssessments,
  });
}

export function useAdminAssessment(assessmentId: string): AdminAssessmentQuery {
  return useQuery<AdminAssessmentRow, Error>({
    queryKey: getAdminAssessmentQueryKey(assessmentId),
    queryFn: () => fetchAdminAssessment(assessmentId),
    enabled: assessmentId !== "",
  });
}
