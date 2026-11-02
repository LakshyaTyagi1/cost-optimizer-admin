import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { PriceList } from "@/components/missing-features/stack-currency";
import {
  missingFeatureStatusLabels,
  type MissingFeatureStatus,
  type StackFeatureOrigin,
} from "@/features/missing-features/api";
import type { PlanSummary } from "@/features/missing-features/utils/stack-selection-view";

/**
 * The badges and colour code shared by every part of the technology stack view, so one
 * meaning always has one colour: black is a tool the customer created, blue is anything
 * the customer added, grey comes from the catalog, amber is reported as missing, and
 * violet is the customer's own price on the Custom plan.
 */

export const statusTone: Record<MissingFeatureStatus, string> = {
  "captured-to-organization": "bg-[#F2F2F7] text-[#5F6368]",
  "organization-to-admin-review": "bg-[#FFF4E5] text-[#B26B00]",
  "admin-review-to-zoftwarehub-catalog": "bg-[#E8F5E9] text-[#1B5E20]",
  "declined-at-admin-review": "bg-[#FDECEA] text-[#B3261E]",
};

const addedTone = "border-[#B9D6FF] bg-[#E8F1FF] text-[#005CC8]";
const catalogTone = "border-black/10 bg-[#F2F2F7] text-[#5F6368]";
export const reportedTone = "border-[#F5D9A8] bg-[#FFF4E5] text-[#B26B00]";
const customTone = "border-[#D9C9F5] bg-[#F3EDFF] text-[#5B35B0]";

export const featureOriginTone: Record<StackFeatureOrigin, string> = {
  added: addedTone,
  catalog: catalogTone,
};

export function formatShortDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function Pill({ children, tone }: { children: ReactNode; tone: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${tone}`}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: MissingFeatureStatus }) {
  return <Pill tone={statusTone[status]}>{missingFeatureStatusLabels[status]}</Pill>;
}

export function planKindBadge(kind: string, isNew: boolean) {
  if (kind === "custom") {
    return { label: "Custom price", tone: `border ${customTone}` };
  }

  if (isNew) {
    return { label: "New plan", tone: `border ${addedTone}` };
  }

  return { label: "Catalog plan", tone: `border ${catalogTone}` };
}

export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/**
 * One plan the customers chose. The price is the headline, since it is what QA compares,
 * the badge says where the plan came from, and a footer strip holds the feature counts and
 * the way into the plan's features, so the card reads top to bottom: which plan, how much,
 * and what it includes.
 */
export function PlanCard({
  onViewFeatures,
  plan,
}: {
  onViewFeatures: () => void;
  plan: PlanSummary;
}) {
  const badge = planKindBadge(plan.kind, plan.isNew);
  const addedCount = plan.features.filter((feature) => feature.origin === "added").length;
  const catalogCount = plan.features.length - addedCount;
  const featureTotal = plan.features.length + plan.reports.length;

  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-white">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#1D1D1F]" title={plan.name}>
              {plan.name}
            </p>
            <p className="text-[11px] text-[#86868B]">
              {plural(plan.customerCount, "customer")}
              {plan.unselectedCount > 0 ? ` · unticked by ${plan.unselectedCount}` : ""}
            </p>
          </div>
          <Pill tone={badge.tone}>{badge.label}</Pill>
        </div>

        <div className="text-[12px]">
          <PriceList label={`Prices for ${plan.name}`} prices={plan.prices} size="hero" />
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-black/[0.06] bg-[#FAFAFA] px-4 py-2.5">
        {featureTotal === 0 ? (
          <span className="text-[11px] text-[#86868B]">No features listed</span>
        ) : (
          <ul aria-label={`Feature counts for ${plan.name}`} className="flex flex-wrap gap-1.5">
            {catalogCount > 0 ? (
              <li>
                <Pill tone={`border ${featureOriginTone.catalog}`}>{catalogCount} catalog</Pill>
              </li>
            ) : null}
            {addedCount > 0 ? (
              <li>
                <Pill tone={`border ${featureOriginTone.added}`}>{addedCount} added</Pill>
              </li>
            ) : null}
            {plan.reports.length > 0 ? (
              <li>
                <Pill tone={`border ${reportedTone}`}>{plan.reports.length} reported</Pill>
              </li>
            ) : null}
          </ul>
        )}

        {featureTotal > 0 ? (
          <button
            type="button"
            onClick={onViewFeatures}
            aria-label={`View the features of ${plan.name}`}
            className="group inline-flex items-center gap-0.5 rounded-md text-[12px] font-medium text-[#007AFF] transition-colors hover:text-[#005CC8] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none"
          >
            View features
            <ChevronRight
              aria-hidden="true"
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>
        ) : null}
      </div>
    </li>
  );
}
