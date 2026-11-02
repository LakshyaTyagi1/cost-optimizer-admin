"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Users, X } from "lucide-react";

import { PriceList } from "@/components/missing-features/stack-currency";
import {
  Pill,
  StatusPill,
  featureOriginTone,
  formatShortDate,
  plural,
  planKindBadge,
  reportedTone,
} from "@/components/missing-features/stack-selection-parts";
import type { PlanSummary } from "@/features/missing-features/utils/stack-selection-view";

/** Below this many entries a filter box is clutter, so it is left out. */
const filterThreshold = 8;

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

type FeatureKind = "reported" | "added" | "catalog";

/** One colour per kind, the same ones used for the badges across the section. */
const kinds: Record<FeatureKind, { dot: string; label: string; tile: string }> = {
  reported: { dot: "bg-[#B26B00]", label: "Reported", tile: reportedTone },
  added: { dot: "bg-[#005CC8]", label: "Added", tile: featureOriginTone.added },
  catalog: { dot: "bg-[#8E8E93]", label: "Catalog", tile: featureOriginTone.catalog },
};

function matchesTerm(term: string, ...values: string[]) {
  return !term || values.some((value) => value.toLowerCase().includes(term));
}

/** How many customers chose something, as a small count that reads the same on every row. */
function CustomerCount({ count }: { count: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[#86868B] tabular-nums"
      title={plural(count, "customer")}
    >
      <Users aria-hidden="true" size={12} />
      {count}
      <span className="sr-only">{count === 1 ? "customer" : "customers"}</span>
    </span>
  );
}

/** A titled group of rows in one bordered card, so a long list reads as one block. */
function FeatureGroup({
  children,
  count,
  kind,
  title,
}: {
  children: ReactNode;
  count: number;
  kind: FeatureKind;
  title: string;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h4 className="flex items-center gap-2 text-[12px] font-semibold text-[#171717]">
        <span aria-hidden="true" className={`size-2 rounded-full ${kinds[kind].dot}`} />
        {title}
        <span className="font-normal text-[#86868B] tabular-nums">{count}</span>
      </h4>
      <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-xl border border-black/[0.08] bg-white">
        {children}
      </ul>
    </section>
  );
}

/**
 * The features of one plan in a side drawer: what the customers who chose it ticked or
 * added, where each came from, how many customers chose it, and the features reported as
 * missing with their review status. A Custom plan has no features of its own, so its drawer
 * lists the ones customers ticked and reported.
 *
 * Read-only. Closes on Escape, on the backdrop and on the close button, keeps keyboard
 * focus inside while open, and puts focus back on the button that opened it.
 */
export function PlanFeaturesPanel({
  onClose,
  plan,
  productName,
}: {
  onClose: () => void;
  plan: PlanSummary;
  productName: string;
}) {
  const [filter, setFilter] = useState("");
  const [kind, setKind] = useState<FeatureKind | "">("");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const term = filter.trim().toLowerCase();
  const badge = planKindBadge(plan.kind, plan.isNew);
  const counts: Record<FeatureKind, number> = {
    added: plan.features.filter((feature) => feature.origin === "added").length,
    catalog: plan.features.filter((feature) => feature.origin === "catalog").length,
    reported: plan.reports.length,
  };
  const total = counts.added + counts.catalog + counts.reported;
  const added = plan.features.filter(
    (feature) => feature.origin === "added" && matchesTerm(term, feature.name),
  );
  const catalog = plan.features.filter(
    (feature) => feature.origin === "catalog" && matchesTerm(term, feature.name),
  );
  const reports = plan.reports.filter((report) =>
    matchesTerm(term, report.name, report.description, report.category),
  );
  const isShown = (group: FeatureKind) => kind === "" || kind === group;
  const shown =
    (isShown("reported") ? reports.length : 0) +
    (isShown("added") ? added.length : 0) +
    (isShown("catalog") ? catalog.length : 0);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();

      return;
    }

    if (event.key !== "Tab" || !panelRef.current) {
      return;
    }

    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!first || !last) {
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" onKeyDown={handleKeyDown}>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity duration-200 starting:opacity-0"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl transition duration-200 ease-out sm:rounded-l-2xl starting:translate-x-6 starting:opacity-0"
      >
        <header className="flex items-start justify-between gap-3 border-b border-black/[0.08] px-5 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate text-[11px] font-medium tracking-[0.04em] text-[#86868B] uppercase">
              {productName}
            </p>
            <h3 id={titleId} className="text-[18px] leading-6 font-semibold text-[#171717]">
              {plan.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[#86868B]">
              <Pill tone={badge.tone}>{badge.label}</Pill>
              <span className="inline-flex items-center gap-1">
                <Users aria-hidden="true" size={12} />
                {plural(plan.customerCount, "customer")}
              </span>
              {plan.unselectedCount > 0 ? <span>Unticked by {plan.unselectedCount}</span> : null}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close the features panel"
            className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-[#5F6368] transition-colors hover:bg-[#F5F5F7] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <div className="flex flex-col gap-5">
            <section
              aria-label="Price"
              className="rounded-xl border border-black/[0.08] bg-[#FAFAFA] px-4 py-3"
            >
              <p className="text-[11px] font-medium text-[#86868B]">Price</p>
              <div className="mt-1 text-[12px]">
                <PriceList label={`Prices for ${plan.name}`} prices={plan.prices} size="hero" />
              </div>
            </section>

            {total === 0 ? (
              <p className="rounded-xl border border-dashed border-black/10 px-4 py-8 text-center text-[12px] text-[#86868B]">
                No features are listed on this plan.
              </p>
            ) : (
              <>
                <div
                  role="group"
                  aria-label="Show features by kind"
                  className="grid grid-cols-3 gap-2"
                >
                  {(Object.keys(kinds) as FeatureKind[]).map((group) => {
                    const isActive = kind === group;

                    return (
                      <button
                        key={group}
                        type="button"
                        disabled={counts[group] === 0}
                        aria-pressed={isActive}
                        onClick={() => setKind(isActive ? "" : group)}
                        className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 disabled:cursor-not-allowed disabled:opacity-40 ${
                          kinds[group].tile
                        } ${isActive ? "ring-2 ring-current" : "hover:brightness-[0.97]"}`}
                      >
                        <span className="text-[18px] leading-6 font-semibold tabular-nums">
                          {counts[group]}
                        </span>
                        <span className="text-[11px] font-medium">{kinds[group].label}</span>
                      </button>
                    );
                  })}
                </div>

                {total > filterThreshold ? (
                  <input
                    type="search"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    placeholder="Filter features"
                    aria-label={`Filter the features of ${plan.name}`}
                    className="h-9 w-full rounded-lg border border-black/10 px-3 text-[12px] transition-colors outline-none focus:border-black/25"
                  />
                ) : null}

                {shown === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-black/10 px-4 py-8 text-center">
                    <p className="text-[12px] text-[#86868B]">No feature matches this filter.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFilter("");
                        setKind("");
                      }}
                      className="rounded-md text-[12px] font-medium text-[#007AFF] hover:text-[#005CC8] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none"
                    >
                      Clear filter
                    </button>
                  </div>
                ) : null}

                {isShown("reported") && reports.length > 0 ? (
                  <FeatureGroup count={reports.length} kind="reported" title="Reported missing">
                    {reports.map((report) => (
                      <li
                        key={report.key}
                        className="flex flex-col gap-1.5 border-l-[3px] border-l-[#F5A524] bg-[#FFFBF5] px-3.5 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[13px] font-semibold text-[#1D1D1F]">{report.name}</p>
                          <CustomerCount count={report.customerCount} />
                        </div>
                        {report.description ? (
                          <p className="text-[12px] leading-[18px] text-[#5F6368]">
                            {report.description}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#86868B]">
                          {report.statuses.map((status) => (
                            <StatusPill key={status} status={status} />
                          ))}
                          {report.category ? <span>{report.category}</span> : null}
                          {report.latestAt ? (
                            <span>Latest {formatShortDate(report.latestAt)}</span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </FeatureGroup>
                ) : null}

                {isShown("added") && added.length > 0 ? (
                  <FeatureGroup count={added.length} kind="added" title="Added by customers">
                    {added.map((feature) => (
                      <li
                        key={feature.name}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px] text-[#1D1D1F]"
                      >
                        <span className="min-w-0 font-medium">{feature.name}</span>
                        <CustomerCount count={feature.customerCount} />
                      </li>
                    ))}
                  </FeatureGroup>
                ) : null}

                {isShown("catalog") && catalog.length > 0 ? (
                  <FeatureGroup count={catalog.length} kind="catalog" title="From the catalog">
                    {catalog.map((feature) => (
                      <li
                        key={feature.name}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px] text-[#1D1D1F]"
                      >
                        <span className="min-w-0 font-medium">{feature.name}</span>
                        <CustomerCount count={feature.customerCount} />
                      </li>
                    ))}
                  </FeatureGroup>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
