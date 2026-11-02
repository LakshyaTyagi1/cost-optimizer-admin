import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptMissingFeatureCandidate,
  declineMissingFeatureCandidate,
  fetchStackSelections,
  fetchMissingFeatures,
  reviewMissingFeatureCandidate,
  revertMissingFeatureCandidate,
  type MissingFeatureActionResult,
  type MissingFeatureCandidate,
  type MissingFeatureQuery,
  type StackSelectionsQuery,
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

export const stackSelectionsQueryKey = [...missingFeaturesQueryKey, "stack-selections"] as const;

/**
 * Read-only: the technology stack customers selected, for QA to read before updating the
 * Master Inventory catalog. It sits under the missing-features key, so accepting,
 * declining or undoing a report refreshes the report statuses shown here.
 */
export function useStackSelectionsQuery(query: StackSelectionsQuery) {
  return useQuery({
    queryKey: [...stackSelectionsQueryKey, query],
    queryFn: ({ signal }) => fetchStackSelections(query, signal),
    placeholderData: keepPreviousData,
    staleTime: missingFeaturesCacheTime,
  });
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

export function useRevertMissingFeatureMutation() {
  const invalidate = useInvalidateMissingFeatures();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (candidate: MissingFeatureCandidate) => revertMissingFeatureCandidate(candidate),
    onSuccess: () => {
      invalidate();
      // Undo removes a feature from the ZOftwarehub product, so every
      // Data Dictionary view that renders a product's features is now stale.
      void queryClient.invalidateQueries({ queryKey: ["data-dictionary"] });
    },
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
