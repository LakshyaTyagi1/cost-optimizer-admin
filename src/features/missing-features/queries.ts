import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptMissingFeatureCandidate,
  declineMissingFeatureCandidate,
  fetchMissingFeatures,
  reviewMissingFeatureCandidate,
  type MissingFeatureActionResult,
  type MissingFeatureCandidate,
  type MissingFeatureQuery,
} from "@/features/missing-features/api";

export const missingFeaturesQueryKey = ["missing-features"] as const;

const missingFeaturesCacheTime = 60_000;

/**
 * Reports are re-read after every action because the backend response already
 * carries the refreshed status, history and review record - there is no second
 * source of truth to reconcile.
 */
export function useMissingFeaturesQuery(query: MissingFeatureQuery) {
  return useQuery({
    queryKey: [...missingFeaturesQueryKey, query],
    queryFn: ({ signal }) => fetchMissingFeatures(query, signal),
    placeholderData: keepPreviousData,
    staleTime: missingFeaturesCacheTime,
  });
}

function useInvalidateMissingFeatures() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: missingFeaturesQueryKey });
}

export function useReviewMissingFeatureMutation() {
  const invalidate = useInvalidateMissingFeatures();

  return useMutation({
    mutationFn: (candidate: MissingFeatureCandidate) => reviewMissingFeatureCandidate(candidate),
    onSuccess: invalidate,
  });
}

export function useAcceptMissingFeatureMutation() {
  const invalidate = useInvalidateMissingFeatures();

  return useMutation({
    mutationFn: (candidate: MissingFeatureCandidate) => acceptMissingFeatureCandidate(candidate),
    onSuccess: invalidate,
  });
}

export function useDeclineMissingFeatureMutation() {
  const invalidate = useInvalidateMissingFeatures();

  return useMutation({
    mutationFn: ({ candidate, reason }: { candidate: MissingFeatureCandidate; reason: string }) =>
      declineMissingFeatureCandidate(candidate, reason),
    onSuccess: invalidate,
  });
}

export type { MissingFeatureActionResult };
