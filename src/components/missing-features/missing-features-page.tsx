"use client";

import { useMemo, useState } from "react";

import { AdminShell } from "@/components/admin-shell/admin-shell";
import {
  formatMissingFeatureHistory,
  missingFeatureStatusLabels,
  type MissingFeatureCandidate,
  type MissingFeatureStatus,
} from "@/features/missing-features/api";
import {
  useAcceptMissingFeatureMutation,
  useDeclineMissingFeatureMutation,
  useMissingFeaturesQuery,
  useReviewMissingFeatureMutation,
  useRevertMissingFeatureMutation,
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
 * Only a captured report can still be claimed for review, and only an accepted
 * one can be undone. The action set narrows rather than offering an action the
 * backend would reject.
 *
 * `revert` is additionally gated on `review.injected`: accept is idempotent, so
 * when it did not create the catalog entry the backend refuses to delete it and
 * the button would only ever produce an error.
 */
function availableActions(candidate: MissingFeatureCandidate) {
  if (candidate.status === "captured-to-organization") {
    return { review: true, accept: false, decline: true, revert: false };
  }

  if (candidate.status === "organization-to-admin-review") {
    return { review: false, accept: true, decline: true, revert: false };
  }

  if (candidate.status === "admin-review-to-zoftwarehub-catalog") {
    return {
      review: false,
      accept: false,
      decline: false,
      revert: candidate.review?.injected === true,
    };
  }

  return { review: false, accept: false, decline: false, revert: false };
}

/**
 * One status count rendered as a filter pill.
 *
 * The pills and the status dropdown write to the same `status` state, so they
 * can never disagree: the active pill always matches the dropdown value, and
 * the counts always describe the whole queue (the backend computes them before
 * filtering). The "Showing X of Y" note appears only while a filter or search
 * is active, which is when the two numbers can differ.
 */
function StatusCountPill({
  active,
  count,
  label,
  onSelect,
  tone,
}: {
  active: boolean;
  count: number;
  label: string;
  onSelect: () => void;
  tone: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium whitespace-nowrap transition outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 ${
        active ? `ring-2 ring-[#007AFF]/50 ${tone}` : `${tone} hover:brightness-[0.97]`
      }`}
    >
      {label}
      <span
        aria-label={`${count} ${label} reports`}
        className={`inline-flex min-w-5 items-center justify-center rounded-full bg-white/70 px-1 text-[10px] font-bold ${
          active ? "text-[#1D1D1F]" : ""
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export function MissingFeaturesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MissingFeatureStatus | "">("");
  const [declineTarget, setDeclineTarget] = useState<MissingFeatureCandidate | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [revertTarget, setRevertTarget] = useState<MissingFeatureCandidate | null>(null);
  const [acceptTarget, setAcceptTarget] = useState<MissingFeatureCandidate | null>(null);
  const [notice, setNotice] = useState("");

  const query = useMemo(() => ({ limit: pageSize, page, search, status }), [page, search, status]);

  const candidatesQuery = useMissingFeaturesQuery(query);
  const reviewMutation = useReviewMissingFeatureMutation();
  const acceptMutation = useAcceptMissingFeatureMutation();
  const declineMutation = useDeclineMissingFeatureMutation();
  const revertMutation = useRevertMissingFeatureMutation();

  const isMutating =
    reviewMutation.isPending ||
    acceptMutation.isPending ||
    declineMutation.isPending ||
    revertMutation.isPending;
  const candidates = candidatesQuery.data?.data ?? [];
  const counts = candidatesQuery.data?.counts;
  const pagination = candidatesQuery.data?.pagination;

  function handleAccept(candidate: MissingFeatureCandidate) {
    // Accepting writes to the shared ZOftwarehub catalog, so it is confirmed
    // rather than applied on a single click.
    setNotice("");
    setAcceptTarget(candidate);
  }

  function handleConfirmAccept() {
    if (!acceptTarget) {
      return;
    }

    const target = acceptTarget;
    setNotice("");

    acceptMutation.mutate(target, {
      onSuccess: (result) => {
        setAcceptTarget(null);
        setNotice(
          result.injection?.injected
            ? `Added "${target.name}" to the ZOftwarehub catalog.`
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

  function handleConfirmRevert() {
    if (!revertTarget) {
      return;
    }

    const target = revertTarget;
    setNotice("");

    revertMutation.mutate(target, {
      onSuccess: (result) => {
        setRevertTarget(null);
        setNotice(
          result.removal?.removed
            ? `Removed "${target.name}" from the catalog and returned the report to review.`
            : `The report is back in review, but the catalog was unchanged. ${
                result.removal?.reason ?? "The feature was not removed."
              }`,
        );
      },
      onError: (error) =>
        setNotice(error instanceof Error ? error.message : "The accept could not be undone."),
    });
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

        <div className="flex flex-col gap-3">
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search feature, tool or product"
            aria-label="Search reported features"
            className="h-9 w-full rounded-lg border border-black/10 px-3 text-[12px] outline-none focus:border-black/25"
          />

          {counts ? (
            <div
              role="group"
              aria-label="Filter reports by status"
              className="flex flex-wrap items-center gap-2"
            >
              <StatusCountPill
                active={status === ""}
                label="All"
                count={counts.total}
                tone="bg-[#F2F2F7] text-[#1D1D1F]"
                onSelect={() => {
                  setStatus("");
                  setPage(1);
                }}
              />
              <StatusCountPill
                active={status === "captured-to-organization"}
                label={missingFeatureStatusLabels["captured-to-organization"]}
                count={counts.captured}
                tone={statusTone["captured-to-organization"]}
                onSelect={() => {
                  setStatus("captured-to-organization");
                  setPage(1);
                }}
              />
              <StatusCountPill
                active={status === "organization-to-admin-review"}
                label={missingFeatureStatusLabels["organization-to-admin-review"]}
                count={counts.underReview}
                tone={statusTone["organization-to-admin-review"]}
                onSelect={() => {
                  setStatus("organization-to-admin-review");
                  setPage(1);
                }}
              />
              <StatusCountPill
                active={status === "admin-review-to-zoftwarehub-catalog"}
                label={missingFeatureStatusLabels["admin-review-to-zoftwarehub-catalog"]}
                count={counts.published}
                tone={statusTone["admin-review-to-zoftwarehub-catalog"]}
                onSelect={() => {
                  setStatus("admin-review-to-zoftwarehub-catalog");
                  setPage(1);
                }}
              />
              <StatusCountPill
                active={status === "declined-at-admin-review"}
                label={missingFeatureStatusLabels["declined-at-admin-review"]}
                count={counts.declined}
                tone={statusTone["declined-at-admin-review"]}
                onSelect={() => {
                  setStatus("declined-at-admin-review");
                  setPage(1);
                }}
              />
              {pagination && (status !== "" || search.trim() !== "") ? (
                <span className="text-[11px] text-[#86868B]">
                  Showing {pagination.totalCount} of {counts.total}
                </span>
              ) : null}
            </div>
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
                            {formatMissingFeatureHistory(candidate.history)}
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

                          {actions.revert ? (
                            <button
                              type="button"
                              disabled={isMutating}
                              onClick={() => {
                                setNotice("");
                                setRevertTarget(candidate);
                              }}
                              className="h-7 rounded-lg border border-black/10 px-2.5 text-[11px] font-medium disabled:opacity-50"
                            >
                              Undo accept
                            </button>
                          ) : null}

                          {!actions.review &&
                          !actions.accept &&
                          !actions.decline &&
                          !actions.revert ? (
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

        {acceptTarget ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-[420px] rounded-xl bg-white p-5 shadow-lg">
              <h2 className="text-[15px] font-semibold text-[#171717]">Accept report</h2>
              <p className="mt-1 text-[12px] text-[#86868B]">
                &quot;{acceptTarget.name}&quot; will be added to the other-features list of &quot;
                {acceptTarget.parentProductName || acceptTarget.toolName}&quot;. It becomes
                selectable for customers whose industry and domain are mapped to that product.
              </p>
              {acceptTarget.description ? (
                <p className="mt-3 rounded-lg border border-black/10 bg-[#FAFAFA] px-3 py-2 text-[12px] text-[#1D1D1F]">
                  {acceptTarget.description}
                </p>
              ) : null}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAcceptTarget(null)}
                  className="h-8 rounded-lg border border-black/10 px-3 text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={acceptMutation.isPending}
                  onClick={handleConfirmAccept}
                  className="h-8 rounded-lg bg-[#007AFF] px-3 text-[12px] font-medium text-white disabled:opacity-50"
                >
                  Accept report
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {revertTarget ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-[420px] rounded-xl bg-white p-5 shadow-lg">
              <h2 className="text-[15px] font-semibold text-[#171717]">Undo accept</h2>
              <p className="mt-1 text-[12px] text-[#86868B]">
                &quot;{revertTarget.name}&quot; will be removed from &quot;
                {revertTarget.parentProductName || revertTarget.toolName}&quot; and the report
                returned to review. Customers who already selected this feature will no longer see
                it.
              </p>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRevertTarget(null)}
                  className="h-8 rounded-lg border border-black/10 px-3 text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={revertMutation.isPending}
                  onClick={handleConfirmRevert}
                  className="h-8 rounded-lg bg-[#B3261E] px-3 text-[12px] font-medium text-white disabled:opacity-50"
                >
                  Undo accept
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
