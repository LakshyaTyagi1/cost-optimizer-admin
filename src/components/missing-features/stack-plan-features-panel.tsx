"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { PriceList } from "@/components/missing-features/stack-currency";
import {
  Pill,
  ReportCard,
  featureOriginTone,
  plural,
  planKindBadge,
} from "@/components/missing-features/stack-selection-parts";
import type { PlanSummary } from "@/features/missing-features/utils/stack-selection-view";

/** Below this many entries a filter box is clutter, so it is left out. */
const filterThreshold = 8;

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function matchesTerm(term: string, ...values: string[]) {
  return !term || values.some((value) => value.toLowerCase().includes(term));
}

/**
 * The features of one plan in a side panel: what the customers who chose it ticked or
 * added, where each came from, how many customers chose it, and the features reported as
 * missing with their review status. A Custom plan has no features of its own, so its panel
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const term = filter.trim().toLowerCase();
  const badge = planKindBadge(plan.kind, plan.isNew);
  const total = plan.features.length + plan.reports.length;
  const added = plan.features.filter(
    (feature) => feature.origin === "added" && matchesTerm(term, feature.name),
  );
  const catalog = plan.features.filter(
    (feature) => feature.origin === "catalog" && matchesTerm(term, feature.name),
  );
  const reports = plan.reports.filter((report) =>
    matchesTerm(term, report.name, report.description, report.category),
  );
  const shown = added.length + catalog.length + reports.length;

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
        className="absolute inset-0 bg-black/30 transition-opacity duration-200 starting:opacity-0"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-[460px] flex-col bg-white shadow-xl transition duration-200 ease-out starting:translate-x-6 starting:opacity-0"
      >
        <header className="flex items-start justify-between gap-3 border-b border-black/[0.08] px-5 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate text-[11px] text-[#86868B]">{productName}</p>
            <h3 id={titleId} className="text-[16px] leading-6 font-semibold text-[#171717]">
              {plan.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill tone={badge.tone}>{badge.label}</Pill>
              <span className="text-[11px] text-[#86868B]">
                Chosen by {plural(plan.customerCount, "customer")}
              </span>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close the features panel"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F5F5F7] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
          <div className="text-[12px]">
            <PriceList label={`Prices for ${plan.name}`} prices={plan.prices} />
          </div>

          {total === 0 ? (
            <p className="text-[12px] text-[#86868B]">No features are listed on this plan.</p>
          ) : (
            <>
              {total > filterThreshold ? (
                <input
                  type="search"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Filter features"
                  aria-label={`Filter the features of ${plan.name}`}
                  className="h-9 w-full rounded-lg border border-black/10 px-3 text-[12px] outline-none focus:border-black/25"
                />
              ) : null}

              {shown === 0 ? (
                <p className="text-[12px] text-[#86868B]">No feature matches this filter.</p>
              ) : null}

              {reports.length > 0 ? (
                <section aria-label="Reported missing" className="flex flex-col gap-1.5">
                  <h4 className="text-[12px] font-semibold text-[#B26B00]">
                    Reported missing ({reports.length})
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {reports.map((report) => (
                      <ReportCard key={report.key} report={report} />
                    ))}
                  </ul>
                </section>
              ) : null}

              {added.length > 0 ? (
                <section aria-label="Added by customers" className="flex flex-col gap-1.5">
                  <h4 className="text-[12px] font-semibold text-[#005CC8]">
                    Added by customers ({added.length})
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {added.map((feature) => (
                      <li
                        key={feature.name}
                        className="flex items-center justify-between gap-2 rounded-lg border border-black/[0.08] px-3 py-2 text-[12px]"
                      >
                        <span className="font-medium text-[#1D1D1F]">{feature.name}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-[11px] text-[#86868B]">
                            {plural(feature.customerCount, "customer")}
                          </span>
                          <Pill tone={`border ${featureOriginTone.added}`}>Added</Pill>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {catalog.length > 0 ? (
                <section aria-label="From the catalog" className="flex flex-col gap-1.5">
                  <h4 className="text-[12px] font-semibold text-[#5F6368]">
                    From the catalog ({catalog.length})
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {catalog.map((feature) => (
                      <li
                        key={feature.name}
                        className="flex items-center justify-between gap-2 rounded-lg border border-black/[0.08] px-3 py-2 text-[12px]"
                      >
                        <span className="font-medium text-[#1D1D1F]">{feature.name}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-[11px] text-[#86868B]">
                            {plural(feature.customerCount, "customer")}
                          </span>
                          <Pill tone={`border ${featureOriginTone.catalog}`}>Catalog</Pill>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
