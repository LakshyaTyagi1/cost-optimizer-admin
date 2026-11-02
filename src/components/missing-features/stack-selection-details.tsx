"use client";

import { useState, type ReactNode } from "react";

import { Money } from "@/components/missing-features/stack-currency";
import { PlanFeaturesPanel } from "@/components/missing-features/stack-plan-features-panel";
import {
  PlanCard,
  Pill,
  StatusPill,
  featureOriginTone,
  formatShortDate,
} from "@/components/missing-features/stack-selection-parts";
import type { StackProduct, StackSelection } from "@/features/missing-features/api";
import { summarizeProduct } from "@/features/missing-features/utils/stack-selection-view";

const headerCell = "px-3 py-2 text-left whitespace-nowrap";
const headRow = "bg-[#FAFAFA] text-[11px] font-semibold tracking-[0.04em] text-[#86868B] uppercase";

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h4 className="text-[12px] font-semibold text-[#171717]">{title}</h4>
      {children}
    </section>
  );
}

/**
 * The two figures from the customer's Technology Stack step. They belong to the customer's
 * assessment, so every tool they chose shows the same pair. A blank Tech Cost is calculated
 * by the customer app from the selected plans and never stored, so none is shown for it.
 */
function ItSpendCell({ selection }: { selection: StackSelection }) {
  const { techCost, totalAnnualItExpenditure } = selection;

  return (
    <dl className="flex flex-col gap-2">
      <div>
        <dt className="text-[11px] text-[#86868B]">Total annual IT expenditure / yr</dt>
        <dd className="font-medium text-[#1D1D1F]">
          {totalAnnualItExpenditure ? (
            <Money
              amount={totalAnnualItExpenditure.amount}
              currency={totalAnnualItExpenditure.currency}
            />
          ) : (
            <span className="font-normal text-[#86868B]">Not entered</span>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-[11px] text-[#86868B]">Tech Cost / yr</dt>
        <dd className="font-medium text-[#1D1D1F]">
          {techCost ? (
            <Money amount={techCost.amount} currency={techCost.currency} />
          ) : (
            <span
              className="font-normal text-[#86868B]"
              title="Left blank by the customer, so the app calculates it from their selected plans. That figure is not stored."
            >
              Not entered
            </span>
          )}
        </dd>
      </div>
    </dl>
  );
}

function CostLine({ cost }: { cost: StackSelection["additionalCosts"][number] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1">
      <span>{cost.name} ·</span>
      {cost.amount ? (
        <Money amount={cost.amount} currency={cost.currency} />
      ) : (
        <span>Amount not set</span>
      )}
      {cost.frequency ? <span>· {cost.frequency}</span> : null}
    </span>
  );
}

/**
 * What one customer chose for this tool, so an admin can see exactly what a user picked.
 * The plan type badge and the aggregated feature lists live on the plan cards and in the
 * plan panel, so they are not repeated on every customer row.
 */
function SelectionRow({ selection }: { selection: StackSelection }) {
  const added = selection.featuresInUse.filter((feature) => feature.origin === "added");
  const fromCatalog = selection.featuresInUse.filter((feature) => feature.origin === "catalog");

  return (
    <tr className="border-t border-black/[0.06] align-top">
      <td className="px-3 py-2">
        <p className="font-semibold text-[#1D1D1F]">{selection.customerName || "Unknown user"}</p>
        {selection.customerCompany ? (
          <p className="text-[11px] text-[#5F6368]">{selection.customerCompany}</p>
        ) : null}
        {selection.customerEmail ? (
          <p className="text-[11px] text-[#86868B]">{selection.customerEmail}</p>
        ) : null}
        {selection.industry || selection.domain ? (
          <p className="text-[11px] text-[#86868B]">
            {[selection.industry, selection.domain].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </td>

      <td className="px-3 py-2">
        {selection.plans.length === 0 ? (
          <span className="text-[#86868B]">—</span>
        ) : (
          <ul className="flex flex-col gap-1">
            {selection.plans.map((plan) => (
              <li key={plan.planId || plan.name} className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-[#1D1D1F]">{plan.name}</span>
                <span className="text-[#5F6368]">
                  {plan.unitPrice ? (
                    <Money amount={plan.unitPrice} currency={plan.currency} />
                  ) : (
                    "No price"
                  )}
                </span>
                {plan.selected ? null : (
                  <Pill tone="border border-black/10 bg-white text-[#5F6368]">Unticked</Pill>
                )}
              </li>
            ))}
          </ul>
        )}
      </td>

      <td className="px-3 py-2">
        {added.length + fromCatalog.length + selection.reportedFeatures.length === 0 ? (
          <span className="text-[#86868B]">—</span>
        ) : (
          <div className="flex max-w-[300px] flex-col gap-1.5">
            {selection.featuresInUse.length > 0 ? (
              <ul className="flex flex-wrap gap-1">
                {[...added, ...fromCatalog].map((feature) => (
                  <li
                    key={`${feature.origin}-${feature.name}`}
                    className={`rounded-md border px-1.5 py-0.5 text-[11px] ${featureOriginTone[feature.origin]}`}
                  >
                    {feature.name}
                  </li>
                ))}
              </ul>
            ) : null}
            {selection.reportedFeatures.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {selection.reportedFeatures.map((report) => (
                  <li
                    key={`${report.candidateId}-${report.name}`}
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    <span className="font-medium text-[#B26B00]">{report.name}</span>
                    <StatusPill status={report.status} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </td>

      <td className="px-3 py-2 text-[#5F6368]">
        {selection.additionalCosts.length === 0 ? (
          "—"
        ) : (
          <ul className="flex flex-col gap-0.5">
            {selection.additionalCosts.map((cost) => (
              <li key={cost.costId || cost.name} className={cost.enabled ? "" : "line-through"}>
                <CostLine cost={cost} />
              </li>
            ))}
          </ul>
        )}
      </td>

      <td className="px-3 py-2">
        <ItSpendCell selection={selection} />
      </td>

      <td className="px-3 py-2 whitespace-nowrap text-[#5F6368]">
        {formatShortDate(selection.selectedAt) || "—"}
      </td>
    </tr>
  );
}

function SelectionsTable({ product }: { product: StackProduct }) {
  return (
    <div className="overflow-x-auto rounded-md border border-black/[0.08] bg-white">
      <table className="w-full min-w-[980px] text-left text-[12px]">
        <thead className={headRow}>
          <tr>
            <th scope="col" className={headerCell}>
              Customer
            </th>
            <th scope="col" className={headerCell}>
              Plans and prices
            </th>
            <th scope="col" className={headerCell}>
              Features ticked and reported
            </th>
            <th scope="col" className={headerCell}>
              Additional costs
            </th>
            <th scope="col" className={headerCell}>
              Annual IT spend
            </th>
            <th scope="col" className={headerCell}>
              Selected on
            </th>
          </tr>
        </thead>
        <tbody>
          {product.selections.map((selection) => (
            <SelectionRow key={selection.assessmentId} selection={selection} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * What the customers selected for one tool or product, shown once each way: the plans
 * they chose with their prices (one card per plan, opening a panel with that plan's
 * features and reports), and a row for each customer's own selection.
 */
export function StackProductDetails({
  panelId,
  product,
}: {
  panelId: string;
  product: StackProduct;
}) {
  const summary = summarizeProduct(product);
  const [openPlanKey, setOpenPlanKey] = useState<string | null>(null);
  const openPlan = summary.plans.find((plan) => plan.key === openPlanKey) ?? null;

  return (
    <tr id={panelId} className="border-t border-black/[0.06] bg-[#F7FBFF]">
      <td colSpan={7} className="px-4 py-4">
        <div className="flex flex-col gap-5">
          {product.description ? (
            <p className="text-[12px] text-[#1D1D1F]">{product.description}</p>
          ) : null}

          <Section title="Plans customers chose">
            {summary.plans.length === 0 ? (
              <p className="text-[12px] text-[#86868B]">No plan was selected for this tool.</p>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-3">
                {summary.plans.map((plan) => (
                  <PlanCard
                    key={plan.key}
                    plan={plan}
                    onViewFeatures={() => setOpenPlanKey(plan.key)}
                  />
                ))}
              </ul>
            )}
          </Section>

          <Section title="Customer selections">
            <SelectionsTable product={product} />
          </Section>
        </div>

        {openPlan ? (
          <PlanFeaturesPanel
            plan={openPlan}
            productName={product.toolName}
            onClose={() => setOpenPlanKey(null)}
          />
        ) : null}
      </td>
    </tr>
  );
}
