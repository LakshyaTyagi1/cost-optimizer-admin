"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, RefreshCw, Search } from "lucide-react";

import {
  CurrencyToggle,
  StackCurrencyProvider,
} from "@/components/missing-features/stack-currency";
import { StackProductDetails } from "@/components/missing-features/stack-selection-details";
import { Pill, formatShortDate } from "@/components/missing-features/stack-selection-parts";
import {
  missingFeatureStatuses,
  missingFeatureStatusLabels,
  type MissingFeatureStatus,
  type StackSelectionSort,
  type StackSelectionsQuery,
} from "@/features/missing-features/api";
import { useDataDictionaryOptions } from "@/features/data-dictionary/queries";
import { useStackSelectionsQuery } from "@/features/missing-features/queries";
import {
  fallbackDisplayToBaseCurrencyRate,
  type DisplayCurrency,
} from "@/features/missing-features/utils/stack-money";
import { summarizeProduct } from "@/features/missing-features/utils/stack-selection-view";

const pageSize = 15;
const searchDebounceMs = 300;

type OriginFilter = NonNullable<StackSelectionsQuery["origin"]>;
/** One filter for the reported features: any report, or reports in one review status. */
type ReportedFilter = "" | "any" | MissingFeatureStatus;

const sortOptions: Array<{ label: string; value: StackSelectionSort }> = [
  { label: "Most selected", value: "most-selected" },
  { label: "Newest", value: "newest" },
  { label: "Name", value: "name" },
];

const selectClass =
  "h-9 rounded-lg border border-black/10 bg-white px-2.5 text-[12px] text-[#1D1D1F] outline-none transition-colors hover:bg-[#FAFAFA] focus:border-black/25";
const headerCell = "px-3 py-2.5 text-left whitespace-nowrap";
const numericHeaderCell = "px-3 py-2.5 text-center whitespace-nowrap";
const headRow = "text-[11px] font-semibold tracking-[0.04em] text-[#86868B] uppercase";

function pluralize(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** A count that stays quiet at zero, so the counts that matter stand out down a column. */
function CountCell({ count, label, tone }: { count: number; label: string; tone?: string }) {
  if (count === 0) {
    return <span className="text-[#C7C7CC]">–</span>;
  }

  return (
    <span
      aria-label={`${count} ${label}`}
      className={
        tone
          ? `inline-flex min-w-6 justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`
          : "text-[#1D1D1F]"
      }
    >
      {count}
    </span>
  );
}

/**
 * The technology stack customers selected, for QA to read before updating the Master
 * Inventory catalog: one row per tool or product with how many customers chose it and
 * how much of it is new, opening to the plans with their prices and features and each
 * customer's own selection.
 *
 * Filtering, sorting and paging happen on the server. Read-only: there is no catalog
 * write API yet, so nothing here changes the catalog or an assessment.
 */
export function StackSelectionsSection() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [origin, setOrigin] = useState<OriginFilter>("");
  const [reported, setReported] = useState<ReportedFilter>("");
  const [sort, setSort] = useState<StackSelectionSort>("most-selected");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  // AED is the base currency, so amounts open in AED and the toggle shows them in USD.
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("AED");
  const searchTimer = useRef<number | null>(null);
  // The backend's configured rate, shared with the Data Dictionary so that saving a new
  // rate there refreshes it here. The fallback is used, and labelled, until it loads.
  const rateQuery = useDataDictionaryOptions({ enabled: true });
  const isFallbackRate = !rateQuery.isSuccess;
  const rate = rateQuery.isSuccess
    ? rateQuery.data.currencyConversionRate
    : fallbackDisplayToBaseCurrencyRate;

  useEffect(
    () => () => {
      if (searchTimer.current !== null) {
        window.clearTimeout(searchTimer.current);
      }
    },
    [],
  );

  const request = useMemo<StackSelectionsQuery>(
    () => ({
      hasReports: reported === "any",
      limit: pageSize,
      origin,
      page,
      reportStatus: reported === "any" ? "" : reported,
      search,
      sort,
    }),
    [origin, page, reported, search, sort],
  );
  const query = useStackSelectionsQuery(request);
  const data = query.data;
  const products = useMemo(() => data?.data ?? [], [data]);
  const summaries = useMemo(
    () => new Map(products.map((product) => [product.key, summarizeProduct(product)])),
    [products],
  );
  const summary = data?.summary;
  const pagination = data?.pagination;
  const allVisibleOpen =
    products.length > 0 && products.every((product) => expanded.has(product.key));
  const hasFilters = search.trim() !== "" || origin !== "" || reported !== "";
  const tabs: Array<{ count: number | null; label: string; value: OriginFilter }> = [
    { count: summary?.products ?? null, label: "All", value: "" },
    {
      count: summary ? summary.products - summary.createdTools : null,
      label: "Catalog products",
      value: "catalog",
    },
    { count: summary?.createdTools ?? null, label: "New tools", value: "created" },
  ];

  function handleSearchChange(value: string) {
    setSearchInput(value);

    if (searchTimer.current !== null) {
      window.clearTimeout(searchTimer.current);
    }

    searchTimer.current = window.setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, searchDebounceMs);
  }

  function toggle(key: string) {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  function toggleAllVisible() {
    setExpanded((current) => {
      const next = new Set(current);

      products.forEach((product) =>
        allVisibleOpen ? next.delete(product.key) : next.add(product.key),
      );

      return next;
    });
  }

  return (
    <StackCurrencyProvider currency={displayCurrency} rate={rate}>
      <section aria-labelledby="stack-selections-heading" className="flex flex-col gap-4">
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                id="stack-selections-heading"
                className="text-[26px] leading-[39px] font-semibold tracking-[0.22px] text-[#171717]"
              >
                Technology stack
              </h1>
              <Pill tone="bg-[#F2F2F7] text-[#5F6368]">Read-only</Pill>
            </div>
            <p className="text-[13px] leading-[19.5px] text-[#86868B]">
              What customers selected, with the plans they chose, their prices and features, and the
              features they added or reported as missing. Review it before updating the Master
              Inventory catalog.
            </p>
            {summary ? (
              <p aria-label="Totals" className="text-[12px] text-[#5F6368]">
                {pluralize(summary.products, "product")}
                <span className="text-[#C7C7CC]"> · </span>
                {pluralize(summary.createdTools, "new tool")}
                <span className="text-[#C7C7CC]"> · </span>
                {pluralize(summary.selections, "selection")}
                <span className="text-[#C7C7CC]"> · </span>
                {pluralize(summary.customers, "customer")}
                <span className="text-[#C7C7CC]"> · </span>
                <span className={summary.reportedFeatures > 0 ? "font-medium text-[#B26B00]" : ""}>
                  {pluralize(summary.reportedFeatures, "report")}
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex items-start gap-2">
            <CurrencyToggle
              currency={displayCurrency}
              isFallbackRate={isFallbackRate}
              onChange={setDisplayCurrency}
              rate={rate}
            />
            <button
              type="button"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
              aria-label="Sync the technology stack"
              title="Sync"
              className="flex size-9 items-center justify-center rounded-lg border border-black/10 bg-white text-[#5F6368] transition-colors hover:bg-[#F5F5F7] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                aria-hidden="true"
                className={query.isFetching ? "animate-spin" : undefined}
              />
            </button>
          </div>
        </header>

        <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white">
          <div
            role="group"
            aria-label="Show"
            className="flex flex-wrap items-center gap-1 border-b border-black/[0.08] px-3"
          >
            {tabs.map((tab) => {
              const isActive = origin === tab.value;

              return (
                <button
                  key={tab.label}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setOrigin(tab.value);
                    setPage(1);
                  }}
                  className={`-mb-px inline-flex h-10 items-center gap-1.5 border-b-2 px-2.5 text-[12px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 ${
                    isActive
                      ? "border-[#171717] text-[#171717]"
                      : "border-transparent text-[#86868B] hover:text-[#171717]"
                  }`}
                >
                  {tab.label}
                  {tab.count === null ? null : (
                    <span
                      className={`rounded-full px-1.5 text-[11px] ${
                        isActive ? "bg-[#171717] text-white" : "bg-[#F2F2F7] text-[#5F6368]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.08] px-3 py-2.5">
            <div className="relative min-w-[220px] flex-1">
              <Search
                aria-hidden="true"
                size={14}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#86868B]"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search tool, plan, feature or customer"
                aria-label="Search the technology stack"
                className="h-9 w-full rounded-lg border border-black/10 pr-3 pl-8 text-[12px] transition-colors outline-none focus:border-black/25"
              />
            </div>
            <label className="sr-only" htmlFor="stack-reported-filter">
              Reported features
            </label>
            <select
              id="stack-reported-filter"
              value={reported}
              onChange={(event) => {
                setReported(event.target.value as ReportedFilter);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">Reported: any</option>
              <option value="any">Has reported features</option>
              {missingFeatureStatuses.map((status) => (
                <option key={status} value={status}>
                  {missingFeatureStatusLabels[status]}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="stack-sort">
              Sort by
            </label>
            <select
              id="stack-sort"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as StackSelectionSort);
                setPage(1);
              }}
              className={selectClass}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={products.length === 0}
              onClick={toggleAllVisible}
              className="h-9 rounded-lg px-3 text-[12px] font-medium text-[#007AFF] transition-colors hover:bg-[#F0F7FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none disabled:text-[#C7C7CC] disabled:hover:bg-transparent"
            >
              {allVisibleOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>

          {query.isError ? (
            <p
              role="alert"
              className="border-b border-black/[0.08] bg-[#FFF1F0] px-4 py-2 text-[12px] font-medium text-[#C5221F]"
            >
              {query.error instanceof Error
                ? query.error.message
                : "Unable to load the technology stack."}
            </p>
          ) : null}

          {query.isLoading ? (
            <p className="px-4 py-10 text-center text-[12px] text-[#86868B]">
              Loading the technology stack…
            </p>
          ) : data ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[12px]">
                <thead className={headRow}>
                  <tr>
                    <th scope="col" className="w-10 px-3 py-2.5">
                      <span className="sr-only">Expand</span>
                    </th>
                    <th scope="col" className={headerCell}>
                      Tool / product
                    </th>
                    <th scope="col" className={numericHeaderCell}>
                      Customers
                    </th>
                    <th scope="col" className={numericHeaderCell}>
                      Plans
                    </th>
                    <th scope="col" className={numericHeaderCell}>
                      Added
                    </th>
                    <th scope="col" className={numericHeaderCell}>
                      Reported
                    </th>
                    <th scope="col" className={`${headerCell} text-right`}>
                      Latest
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="border-t border-black/[0.06] px-3 py-10 text-center text-[#86868B]"
                      >
                        {hasFilters
                          ? "No tools or products match these filters."
                          : "No customer has selected a technology yet."}
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const productSummary = summaries.get(product.key);
                      const isOpen = expanded.has(product.key);
                      const panelId = `stack-selection-${product.key.replace(/[^a-z0-9]/gi, "-")}`;
                      const subtitle = [
                        product.company,
                        [product.category, product.subCategory].filter(Boolean).join(" › "),
                      ]
                        .filter(Boolean)
                        .join(" · ");

                      return (
                        <Fragment key={product.key}>
                          <tr
                            onClick={() => toggle(product.key)}
                            className={`cursor-pointer border-t border-black/[0.06] align-middle transition-colors ${
                              isOpen ? "bg-[#F7FBFF]" : "hover:bg-[#FAFAFA]"
                            }`}
                          >
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggle(product.key);
                                }}
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                aria-label={`${isOpen ? "Collapse" : "Expand"} ${product.toolName}`}
                                className="flex size-6 items-center justify-center rounded-md text-[#86868B] transition-colors hover:bg-[#EAF4FF] hover:text-[#171717] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none"
                              >
                                <ChevronRight
                                  aria-hidden="true"
                                  size={16}
                                  className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                                />
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-semibold text-[#171717]">
                                  {product.toolName}
                                </span>
                                {product.origin === "created-tool" ? (
                                  <Pill tone="bg-[#171717] text-white">New tool</Pill>
                                ) : null}
                              </div>
                              {subtitle ? (
                                <p className="mt-0.5 text-[11px] text-[#86868B]">{subtitle}</p>
                              ) : null}
                            </td>
                            <td className="px-3 py-3 text-center tabular-nums">
                              <CountCell count={product.customerCount} label="customers" />
                            </td>
                            <td className="px-3 py-3 text-center tabular-nums">
                              <CountCell count={productSummary?.plans.length ?? 0} label="plans" />
                            </td>
                            <td className="px-3 py-3 text-center tabular-nums">
                              <CountCell
                                count={productSummary?.addedFeatures.length ?? 0}
                                label="features added by customers"
                                tone="bg-[#E8F1FF] text-[#005CC8]"
                              />
                            </td>
                            <td className="px-3 py-3 text-center tabular-nums">
                              <CountCell
                                count={productSummary?.reports.length ?? 0}
                                label="features reported missing"
                                tone="bg-[#FFF4E5] text-[#B26B00]"
                              />
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap text-[#5F6368]">
                              {formatShortDate(product.latestAt) || "—"}
                            </td>
                          </tr>
                          {isOpen ? (
                            <StackProductDetails panelId={panelId} product={product} />
                          ) : null}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          {data ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.08] px-3 py-2.5 text-[12px] text-[#86868B]">
              <span>
                {hasFilters
                  ? `Showing ${data.pagination.totalCount} of ${data.summary.products}`
                  : pluralize(data.pagination.totalCount, "product")}
              </span>
              {pagination && pagination.totalPages > 1 ? (
                <nav aria-label="Tools and products pages" className="flex items-center gap-2">
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page <= 1 || query.isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="h-8 rounded-lg border border-black/10 bg-white px-3 font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages || query.isFetching}
                    onClick={() => setPage((current) => current + 1)}
                    className="h-8 rounded-lg border border-black/10 bg-white px-3 font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7] disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </StackCurrencyProvider>
  );
}
