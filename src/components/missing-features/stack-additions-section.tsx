"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";

import {
  type StackAdditionBase,
  type StackAdditionFeature,
  type StackAdditionFeatureKind,
  type StackAdditionPlan,
  type StackAdditionTool,
  type StackAdditions,
} from "@/features/missing-features/api";
import { useStackAdditionsQuery } from "@/features/missing-features/queries";

const pageSize = 15;

const featureKindLabels: Record<StackAdditionFeatureKind, { label: string; tone: string }> = {
  "added-feature": { label: "Added", tone: "bg-[#E8F1FF] text-[#005CC8]" },
  "plan-feature": { label: "In new plan", tone: "bg-[#F2F2F7] text-[#5F6368]" },
  "reported-feature": { label: "Missing", tone: "bg-[#FFF4E5] text-[#B26B00]" },
};

/** One tool or product with the plans and features customers added to it. */
type ToolGroup = {
  base: StackAdditionBase;
  details: StackAdditionTool | null;
  features: StackAdditionFeature[];
  id: string;
  plans: StackAdditionPlan[];
};

function formatPrice(amount: string, currency: string) {
  return amount ? `${amount} ${currency}`.trim() : "Not set";
}

function Pill({ children, tone }: { children: ReactNode; tone: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${tone}`}
    >
      {children}
    </span>
  );
}

/**
 * Groups the flat plan, feature and created-tool rows by the tool they belong to,
 * so each tool or product is one row that can be opened. A catalog tool appears
 * only when a customer added a plan or feature to it. The same product chosen by
 * several customers is one row, since QA adds it to the catalog once.
 */
function groupByTool(data: StackAdditions): ToolGroup[] {
  const groups = new Map<string, ToolGroup>();
  const groupFor = (base: StackAdditionBase) => {
    const id = `${base.toolOrigin}::${base.toolName.trim().toLowerCase()}`;
    let group = groups.get(id);

    if (!group) {
      group = { base, details: null, features: [], id, plans: [] };
      groups.set(id, group);
    }

    return group;
  };
  const isNew = <Row extends { name?: string; planName?: string }>(
    rows: Row[],
    key: (row: Row) => string,
    row: Row,
  ) => !rows.some((existing) => key(existing) === key(row));

  data.tools.forEach((tool) => {
    const group = groupFor(tool);

    group.details = group.details ?? tool;
  });
  data.plans.forEach((plan) => {
    const group = groupFor(plan);

    if (isNew(group.plans, (row) => row.planName.trim().toLowerCase(), plan)) {
      group.plans.push(plan);
    }
  });
  data.features.forEach((feature) => {
    const group = groupFor(feature);

    if (
      isNew(
        group.features,
        (row) =>
          `${row.featureKind}::${row.planName.trim().toLowerCase()}::${row.name.trim().toLowerCase()}`,
        feature,
      )
    ) {
      group.features.push(feature);
    }
  });

  return Array.from(groups.values()).sort((first, second) =>
    first.base.toolName.localeCompare(second.base.toolName, "en"),
  );
}

function groupMatches(group: ToolGroup, term: string) {
  const values = [
    group.base.toolName,
    group.details?.company,
    group.details?.category,
    group.details?.subCategory,
    group.details?.description,
    ...group.plans.flatMap((plan) => [plan.planName, ...plan.featureNames]),
    ...group.features.flatMap((feature) => [feature.name, feature.description, feature.category]),
  ];

  return values.some((value) => (value ?? "").toLowerCase().includes(term));
}

const headerCell = "px-3 py-2 text-left whitespace-nowrap";
const headRow = "bg-[#FAFAFA] text-[11px] font-semibold tracking-[0.04em] text-[#86868B] uppercase";

function PlansTable({ plans }: { plans: StackAdditionPlan[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-[12px] font-semibold text-[#171717]">Plans ({plans.length})</h4>
      <div className="overflow-x-auto rounded-md border border-black/[0.08] bg-white">
        <table className="w-full min-w-[420px] text-left text-[12px]">
          <thead className={headRow}>
            <tr>
              <th scope="col" className={headerCell}>
                Plan
              </th>
              <th scope="col" className={headerCell}>
                Unit price
              </th>
              <th scope="col" className={headerCell}>
                Features
              </th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-3 text-center text-[#86868B]">
                  No plans were added.
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.planId} className="border-t border-black/[0.06] align-top">
                  <td className="px-3 py-2 font-semibold text-[#1D1D1F]">{plan.planName}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-[#5F6368]">
                    {formatPrice(plan.unitPrice, plan.currency)}
                  </td>
                  <td className="px-3 py-2 text-[#5F6368]">
                    <p className="max-w-[360px]">
                      {plan.featureNames.length > 0 ? plan.featureNames.join(", ") : "—"}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeaturesTable({ features }: { features: StackAdditionFeature[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-[12px] font-semibold text-[#171717]">Features ({features.length})</h4>
      <div className="overflow-x-auto rounded-md border border-black/[0.08] bg-white">
        <table className="w-full min-w-[560px] text-left text-[12px]">
          <thead className={headRow}>
            <tr>
              <th scope="col" className={headerCell}>
                Feature
              </th>
              <th scope="col" className={headerCell}>
                Plan
              </th>
              <th scope="col" className={headerCell}>
                Kind
              </th>
              <th scope="col" className={headerCell}>
                Category
              </th>
              <th scope="col" className={headerCell}>
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {features.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-center text-[#86868B]">
                  No features were added or reported.
                </td>
              </tr>
            ) : (
              features.map((feature) => (
                <tr
                  key={`${feature.featureKind}-${feature.planId}-${feature.name}`}
                  className="border-t border-black/[0.06] align-top"
                >
                  <td className="px-3 py-2 font-semibold text-[#1D1D1F]">{feature.name}</td>
                  <td className="px-3 py-2 text-[#5F6368]">{feature.planName || "—"}</td>
                  <td className="px-3 py-2">
                    <Pill tone={featureKindLabels[feature.featureKind].tone}>
                      {featureKindLabels[feature.featureKind].label}
                    </Pill>
                  </td>
                  <td className="px-3 py-2 text-[#5F6368]">{feature.category || "—"}</td>
                  <td className="px-3 py-2 text-[#5F6368]">
                    <p className="max-w-[320px]">{feature.description || "—"}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * What QA needs to add to the Master Inventory catalog, as one table of tools and
 * products. Each row opens to the description, the plans customers added with their
 * prices and features, and the features customers added or reported as missing.
 * Read-only: there is no catalog write API yet.
 */
export function StackAdditionsSection() {
  const [search, setSearch] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const query = useStackAdditionsQuery();
  const data = query.data;
  const term = search.trim().toLowerCase();

  const groups = useMemo(() => (data ? groupByTool(data) : []), [data]);
  const filtered = useMemo(
    () => (term ? groups.filter((group) => groupMatches(group, term)) : groups),
    [groups, term],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allVisibleOpen = visible.length > 0 && visible.every((group) => expanded.has(group.id));

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function toggleAllVisible() {
    setExpanded((current) => {
      const next = new Set(current);

      visible.forEach((group) => (allVisibleOpen ? next.delete(group.id) : next.add(group.id)));

      return next;
    });
  }

  return (
    <section aria-labelledby="stack-additions-heading" className="flex flex-col gap-4">
      <header>
        <h2
          id="stack-additions-heading"
          className="text-[18px] leading-7 font-semibold text-[#171717]"
        >
          Technology stack additions
        </h2>
        <p className="text-[13px] leading-[19.5px] text-[#86868B]">
          Tools and products customers created or added plans and features to. For QA when growing
          or updating the Master Inventory catalog. Read-only; there is no catalog update API yet.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setRequestedPage(1);
          }}
          placeholder="Search tool, plan or feature"
          aria-label="Search stack additions"
          className="h-9 w-full rounded-lg border border-black/10 px-3 text-[12px] outline-none focus:border-black/25 sm:w-auto sm:flex-1"
        />
        <button
          type="button"
          disabled={visible.length === 0}
          onClick={toggleAllVisible}
          className="inline-flex h-9 shrink-0 items-center rounded-lg border border-black/10 bg-white px-3 text-[12px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none disabled:opacity-50"
        >
          {allVisibleOpen ? "Collapse all" : "Expand all"}
        </button>
        <button
          type="button"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
          aria-label="Sync stack additions"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-[12px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw
            size={14}
            aria-hidden="true"
            className={query.isFetching ? "animate-spin" : undefined}
          />
          Sync
        </button>
      </div>

      {query.isError ? (
        <p
          role="alert"
          className="rounded-lg bg-[#FFF1F0] px-3 py-2 text-[12px] font-medium text-[#C5221F]"
        >
          {query.error instanceof Error ? query.error.message : "Unable to load stack additions."}
        </p>
      ) : null}

      {query.isLoading ? (
        <p className="text-[12px] text-[#86868B]">Loading stack additions…</p>
      ) : data ? (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-lg border border-black/[0.08] bg-white">
            <table className="w-full min-w-[640px] text-left text-[12px]">
              <thead className={headRow}>
                <tr>
                  <th scope="col" className="w-10 px-3 py-2">
                    <span className="sr-only">Expand</span>
                  </th>
                  <th scope="col" className={headerCell}>
                    Tool / product
                  </th>
                  <th scope="col" className={headerCell}>
                    Company
                  </th>
                  <th scope="col" className={headerCell}>
                    Category
                  </th>
                  <th scope="col" className={headerCell}>
                    Plans
                  </th>
                  <th scope="col" className={headerCell}>
                    Features
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[#86868B]">
                      {term
                        ? "No tools or products match this search."
                        : "No customer has created a tool or added a plan or feature yet."}
                    </td>
                  </tr>
                ) : (
                  visible.map((group) => {
                    const isOpen = expanded.has(group.id);
                    const panelId = `stack-additions-${group.id.replace(/[^a-z0-9]/gi, "-")}`;

                    return (
                      <Fragment key={group.id}>
                        <tr
                          className={`border-t border-black/[0.06] align-top ${isOpen ? "bg-[#F7FBFF]" : ""}`}
                        >
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => toggle(group.id)}
                              aria-expanded={isOpen}
                              aria-controls={panelId}
                              aria-label={`${isOpen ? "Collapse" : "Expand"} ${group.base.toolName}`}
                              className="flex size-6 items-center justify-center rounded-md text-[#5F6368] hover:bg-[#EAF4FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none"
                            >
                              <ChevronRight
                                aria-hidden="true"
                                size={16}
                                className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
                              />
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-[#1D1D1F]">{group.base.toolName}</p>
                            <p className="text-[11px] text-[#86868B]">
                              {group.base.toolOrigin === "created-tool"
                                ? "Created by customer"
                                : "Catalog product"}
                            </p>
                          </td>
                          <td className="px-3 py-2 text-[#5F6368]">
                            {group.details?.company || "—"}
                          </td>
                          <td className="px-3 py-2 text-[#5F6368]">
                            {[group.details?.category, group.details?.subCategory]
                              .filter(Boolean)
                              .join(" › ") || "—"}
                          </td>
                          <td className="px-3 py-2 text-[#5F6368]">{group.plans.length}</td>
                          <td className="px-3 py-2 text-[#5F6368]">{group.features.length}</td>
                        </tr>
                        {isOpen ? (
                          <tr id={panelId} className="border-t border-black/[0.06] bg-[#F7FBFF]">
                            <td colSpan={6} className="px-4 py-4">
                              <div className="flex flex-col gap-4">
                                {group.details?.description ? (
                                  <p className="text-[12px] text-[#1D1D1F]">
                                    {group.details.description}
                                  </p>
                                ) : null}
                                <PlansTable plans={group.plans} />
                                <FeaturesTable features={group.features} />
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <nav
              aria-label="Tools and products pages"
              className="flex items-center justify-end gap-2 text-[12px]"
            >
              <span className="text-[#86868B]">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setRequestedPage(page - 1)}
                className="h-8 rounded-lg border border-black/10 bg-white px-3 font-medium disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setRequestedPage(page + 1)}
                className="h-8 rounded-lg border border-black/10 bg-white px-3 font-medium disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
