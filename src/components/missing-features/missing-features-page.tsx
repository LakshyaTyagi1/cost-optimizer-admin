"use client";

import { useMemo, useState } from "react";

import { AdminShell } from "@/components/admin-shell/admin-shell";
import {
  missingFeatureStatusLabels,
  missingFeatureStatuses,
  type MissingFeatureCandidate,
  type MissingFeatureStatus,
} from "@/features/missing-features/api";
import {
  useAcceptMissingFeatureMutation,
  useDeclineMissingFeatureMutation,
  useMissingFeaturesQuery,
  useReviewMissingFeatureMutation,
} from "@/features/missing-features/queries";

const pageSize = 20;

const statusTone: Record<MissingFeatureStatus, string> = {
  "captured-to-organization": "bg-[#F2F2F7] text-[#5F6368]",
  "organization-to-admin-review": "bg-[#FFF4E5] text-[#B26B00]",
  "admin-review-to-zoftwarehub-catalog": "bg-[#E8F5E9] text-[#1B5E20]",
  "declined-at-admin-review": "bg-[#FDECEA] text-[#B3261E]",
};

/**
 * Formats a report's timestamp as day, date and time.
 *
 * Follows the dashboard's `formatWhen` convention (`en-GB`, 12-hour clock with an
 * uppercase meridiem) so timestamps read identically across the admin console.
 * Returns an empty string rather than "--" because this sits inside a table cell
 * that already renders nothing when the value is absent.
 */
function formatWhen(value?: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hour12: true,
    minute: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(parsed)
    .replace(/\b(am|pm)\b/i, (meridiem) => meridiem.toUpperCase());
}

/** The weekday, e.g. "Wednesday". Shown under the timestamp. */
function formatWeekday(value?: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(parsed);
}

/**
 * Only a captured report can still be claimed for review. Once it reaches the
 * catalog or is declined the decision is final, so the action set narrows
 * rather than offering an action the backend would reject.
 */
function availableActions(candidate: MissingFeatureCandidate) {
  if (candidate.status === "captured-to-organization") {
    return { review: true, accept: false, decline: true };
  }

  if (candidate.status === "organization-to-admin-review") {
    return { review: false, accept: true, decline: true };
  }

  return { review: false, accept: false, decline: false };
}

export function MissingFeaturesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MissingFeatureStatus | "">("");
  const [declineTarget, setDeclineTarget] = useState<MissingFeatureCandidate | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [notice, setNotice] = useState("");

  const query = useMemo(() => ({ limit: pageSize, page, search, status }), [page, search, status]);

  const candidatesQuery = useMissingFeaturesQuery(query);
  const reviewMutation = useReviewMissingFeatureMutation();
  const acceptMutation = useAcceptMissingFeatureMutation();
  const declineMutation = useDeclineMissingFeatureMutation();

  const isMutating =
    reviewMutation.isPending || acceptMutation.isPending || declineMutation.isPending;
  const candidates = candidatesQuery.data?.data ?? [];
  const counts = candidatesQuery.data?.counts;
  const pagination = candidatesQuery.data?.pagination;

  function handleAccept(candidate: MissingFeatureCandidate) {
    setNotice("");

    acceptMutation.mutate(candidate, {
      onSuccess: (result) => {
        setNotice(
          result.injection?.injected
            ? `Added "${candidate.name}" to the ZOftwarehub catalog.`
            : (result.injection?.reason ??
                "The review was recorded, but the catalog was not updated."),
        );
      },
      onError: (error) =>
        setNotice(error instanceof Error ? error.message : "The report could not be accepted."),
    });
  }

  function handleReview(candidate: MissingFeatureCandidate) {
    setNotice("");

    reviewMutation.mutate(candidate, {
      onError: (error) =>
        setNotice(
          error instanceof Error ? error.message : "The report could not be opened for review.",
        ),
    });
  }

  function handleConfirmDecline() {
    if (!declineTarget) {
      return;
    }

    const target = declineTarget;
    setNotice("");

    declineMutation.mutate(
      { candidate: target, reason: declineReason },
      {
        onSuccess: () => {
          setDeclineTarget(null);
          setDeclineReason("");
        },
        onError: (error) =>
          setNotice(error instanceof Error ? error.message : "The report could not be declined."),
      },
    );
  }

  return (
    <AdminShell activeItem="Missing Features">
      <div className="flex max-w-full flex-col gap-6 overflow-hidden lg:pr-6">
        <header>
          <h1 className="text-[26px] leading-[39px] font-semibold tracking-[0.22px] text-[#171717]">
            Missing Features
          </h1>
          <p className="text-[13px] leading-[19.5px] font-normal text-[#86868B]">
            Features customers reported as missing from their tools. Accepting one publishes it to
            the ZOftwarehub catalog so future assessments can select it.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search feature, tool or product"
            aria-label="Search reported features"
            className="h-9 w-full max-w-[320px] rounded-lg border border-black/10 px-3 text-[12px] outline-none focus:border-black/25"
          />

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as MissingFeatureStatus | "");
              setPage(1);
            }}
            aria-label="Filter by review status"
            className="h-9 rounded-lg border border-black/10 bg-white px-3 text-[12px] outline-none focus:border-black/25"
          >
            <option value="">All statuses</option>
            {missingFeatureStatuses.map((value) => (
              <option key={value} value={value}>
                {missingFeatureStatusLabels[value]}
              </option>
            ))}
          </select>

          {counts ? (
            <p className="text-[12px] text-[#86868B]">
              {counts.total} total &middot; {counts.captured} captured &middot; {counts.underReview}{" "}
              under review &middot; {counts.published} accepted &middot; {counts.declined} declined
            </p>
          ) : null}
        </div>

        {notice ? (
          <p
            role="status"
            className="rounded-lg border border-black/10 bg-[#FAFAFA] px-3 py-2 text-[12px] text-[#1D1D1F]"
          >
            {notice}
          </p>
        ) : null}

        {candidatesQuery.isError ? (
          <p role="alert" className="text-[12px] text-[#B3261E]">
            Reported features could not be loaded. Try again.
          </p>
        ) : null}

        {candidatesQuery.isPending ? (
          <p className="text-[12px] text-[#86868B]">Loading reported features…</p>
        ) : candidates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-black/10 px-4 py-8 text-center text-[12px] text-[#86868B]">
            No reported features match these filters.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-black/10">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/10 bg-[#FAFAFA] text-[11px] tracking-[0.06em] text-[#86868B] uppercase">
                  <th className="px-3 py-2 font-medium">Feature</th>
                  <th className="px-3 py-2 font-medium">Reported by</th>
                  <th className="px-3 py-2 font-medium">Tool / product</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Reported</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, rowIndex) => {
                  const actions = availableActions(candidate);

                  return (
                    <tr
                      // `candidateId` is the key the backend addresses a report by.
                      // The row index is appended so a legacy report that still
                      // has no id gets a unique React key instead of colliding.
                      key={`${candidate.assessmentId}:${candidate.candidateId || "unknown"}:${rowIndex}`}
                      className="border-b border-black/[0.08] align-top"
                    >
                      <td className="px-3 py-2.5">
                        <p className="text-[13px] font-medium text-[#171717]">{candidate.name}</p>
                        {candidate.description ? (
                          <p className="mt-0.5 text-[11px] text-[#86868B]">
                            {candidate.description}
                          </p>
                        ) : null}
                        {candidate.review?.reason ? (
                          <p className="mt-1 text-[11px] text-[#B3261E]">
                            Declined: {candidate.review.reason}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-3 py-2.5 text-[12px] text-[#1D1D1F]">
                        {/* An admin acts on someone else's report, so whose it is
                            matters as much as what it is. Falls back to a dash
                            when the owner was deleted or never populated. */}
                        <p className="font-medium text-[#171717]">
                          {candidate.customerName || "Unknown user"}
                        </p>
                        {candidate.customerEmail ? (
                          <p className="mt-0.5 text-[11px] text-[#86868B]">
                            {candidate.customerEmail}
                          </p>
                        ) : null}
                        {candidate.customerCompany ? (
                          <p className="mt-0.5 text-[11px] text-[#86868B]">
                            {candidate.customerCompany}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-3 py-2.5 text-[12px] text-[#1D1D1F]">
                        <p>{candidate.parentProductName || candidate.toolName}</p>
                        {candidate.parentProductId ? (
                          <p className="mt-0.5 text-[11px] text-[#86868B]">
                            {candidate.parentProductId}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] leading-[16.5px] font-medium whitespace-nowrap ${statusTone[candidate.status]}`}
                        >
                          {missingFeatureStatusLabels[candidate.status]}
                        </span>
                        {candidate.history.length > 0 ? (
                          <p className="mt-1 text-[11px] text-[#86868B]">
                            {candidate.history.map((entry) => entry.event).join(" → ")}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-3 py-2.5 text-[11px] whitespace-nowrap text-[#86868B]">
                        {formatWhen(candidate.createdAt) ? (
                          <>
                            <p className="text-[12px] text-[#1D1D1F]">
                              {formatWhen(candidate.createdAt)}
                            </p>
                            <p className="mt-0.5">{formatWeekday(candidate.createdAt)}</p>
                          </>
                        ) : null}
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {actions.review ? (
                            <button
                              type="button"
                              disabled={isMutating}
                              onClick={() => handleReview(candidate)}
                              className="h-7 rounded-lg border border-black/10 px-2.5 text-[11px] font-medium disabled:opacity-50"
                            >
                              Start review
                            </button>
                          ) : null}

                          {actions.accept ? (
                            <button
                              type="button"
                              disabled={isMutating}
                              onClick={() => handleAccept(candidate)}
                              className="h-7 rounded-lg bg-[#007AFF] px-2.5 text-[11px] font-medium text-white disabled:opacity-50"
                            >
                              Accept
                            </button>
                          ) : null}

                          {actions.decline ? (
                            <button
                              type="button"
                              disabled={isMutating}
                              onClick={() => {
                                setDeclineTarget(candidate);
                                setDeclineReason("");
                              }}
                              className="h-7 rounded-lg border border-[#B3261E]/30 px-2.5 text-[11px] font-medium text-[#B3261E] disabled:opacity-50"
                            >
                              Decline
                            </button>
                          ) : null}

                          {!actions.review && !actions.accept && !actions.decline ? (
                            <span className="text-[11px] text-[#86868B]">Settled</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={page <= 1 || candidatesQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-8 rounded-lg border border-black/10 px-3 text-[12px] disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-[12px] text-[#86868B]">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages || candidatesQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
              className="h-8 rounded-lg border border-black/10 px-3 text-[12px] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}

        {declineTarget ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-[420px] rounded-xl bg-white p-5 shadow-lg">
              <h2 className="text-[15px] font-semibold text-[#171717]">Decline report</h2>
              <p className="mt-1 text-[12px] text-[#86868B]">
                Declining is final and cannot be undone here. The reason is stored with the report.
              </p>

              <label className="mt-4 block text-[12px] font-medium text-[#1D1D1F]">
                Reason
                <textarea
                  value={declineReason}
                  onChange={(event) => setDeclineReason(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-[12px] outline-none focus:border-black/25"
                />
              </label>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeclineTarget(null);
                    setDeclineReason("");
                  }}
                  className="h-8 rounded-lg border border-black/10 px-3 text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={declineMutation.isPending}
                  onClick={handleConfirmDecline}
                  className="h-8 rounded-lg bg-[#B3261E] px-3 text-[12px] font-medium text-white disabled:opacity-50"
                >
                  Decline report
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
