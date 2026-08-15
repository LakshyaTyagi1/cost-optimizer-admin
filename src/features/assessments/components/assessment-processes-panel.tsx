"use client";

import {
  Fragment,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { AssessmentMobileMetric as MobileMetric } from "@/features/assessments/components/assessment-mobile-metric";
import type { AdminAssessmentProcess } from "@/features/assessments/model";
import type { AssessmentSummary } from "@/features/assessments/view-model";

const automationLevelOptions = [1, 2, 3, 4, 5] as const;
const detailValueClass =
  "min-h-9 w-full rounded-md border border-black/[0.08] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#171717]";

type CurrencyAmount = {
  amount?: number;
  currency?: string;
};

type ProcessFormatters = {
  formatBaseCurrency: (baseCurrencyAmount: number) => string;
  formatCurrencyAmountInBaseCurrency: (
    currencyAmount?: CurrencyAmount | null,
    currencyConversionRate?: number,
  ) => string;
  formatNumberInput: (value: number | undefined) => string;
  formatPercentValue: (value?: number) => string;
  getAutomationLabel: (level: number) => string;
  getProcessAuditLabel: (process: AdminAssessmentProcess) => string;
  getProcessCostInBaseCurrency: (
    process: AdminAssessmentProcess,
    currencyConversionRate?: number,
  ) => number;
  getProcessFteLabel: (process: AdminAssessmentProcess) => string;
  getProcessKey: (process: AdminAssessmentProcess) => string;
  getProcessSavingInBaseCurrency: (process: AdminAssessmentProcess, baseCurrencyCost: number) => number;
  getProcessSoftwareCostLabel: (
    process: AdminAssessmentProcess,
    currencyConversionRate?: number,
  ) => string;
  isCustomProcess: (process: AdminAssessmentProcess) => boolean;
};

type AssessmentProcessesPanelProps = ProcessFormatters & {
  assessment: AssessmentSummary;
};

export function AssessmentProcessesPanel({
  assessment,
  formatBaseCurrency,
  formatCurrencyAmountInBaseCurrency,
  formatNumberInput,
  formatPercentValue,
  getAutomationLabel,
  getProcessAuditLabel,
  getProcessCostInBaseCurrency,
  getProcessFteLabel,
  getProcessKey,
  getProcessSavingInBaseCurrency,
  getProcessSoftwareCostLabel,
  isCustomProcess,
}: AssessmentProcessesPanelProps) {
  const [expandedProcessKey, setExpandedProcessKey] = useState("");
  const customProcesses = assessment.customProcesses;
  const selectedProcesses = assessment.processes.filter((process) => !isCustomProcess(process));

  function toggleProcessPreview(processSectionKey: string, isExpanded: boolean) {
    setExpandedProcessKey(isExpanded ? "" : processSectionKey);
  }

  function getProcessSectionKey(sectionKey: string, process: AdminAssessmentProcess) {
    return `${sectionKey}:${getProcessKey(process)}`;
  }

  function renderProcessTable(
    processes: AdminAssessmentProcess[],
    sectionKey: string,
    emptyMessage: string,
  ) {
    return (
      <div>
        <div className="divide-y divide-black/[0.05] md:hidden">
          {processes.length ? (
            processes.map((process) => {
              const processSectionKey = getProcessSectionKey(sectionKey, process);
              const isExpanded = expandedProcessKey === processSectionKey;

              return (
                <div key={processSectionKey}>
                  <AssessmentProcessMobileCard
                    currencyConversionRate={assessment.currencyConversionRate}
                    expanded={isExpanded}
                    formatBaseCurrency={formatBaseCurrency}
                    getAutomationLabel={getAutomationLabel}
                    getProcessAuditLabel={getProcessAuditLabel}
                    getProcessCostInBaseCurrency={getProcessCostInBaseCurrency}
                    getProcessFteLabel={getProcessFteLabel}
                    getProcessSavingInBaseCurrency={getProcessSavingInBaseCurrency}
                    getProcessSoftwareCostLabel={getProcessSoftwareCostLabel}
                    process={process}
                    onToggle={() => toggleProcessPreview(processSectionKey, isExpanded)}
                  />
                  {isExpanded ? (
                    <div className="border-t border-black/[0.05] bg-[#FAFAFA]">
                      <AssessmentProcessPreview
                        currencyConversionRate={assessment.currencyConversionRate}
                        formatBaseCurrency={formatBaseCurrency}
                        formatCurrencyAmountInBaseCurrency={formatCurrencyAmountInBaseCurrency}
                        formatNumberInput={formatNumberInput}
                        formatPercentValue={formatPercentValue}
                        getProcessAuditLabel={getProcessAuditLabel}
                        getProcessCostInBaseCurrency={getProcessCostInBaseCurrency}
                        getProcessSoftwareCostLabel={getProcessSoftwareCostLabel}
                        process={process}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-sm font-semibold text-[#86868B]">
              {emptyMessage}
            </div>
          )}
        </div>

        <div className="hidden overflow-auto md:block">
        <table className="w-full min-w-[920px] table-fixed border-collapse">
          <thead>
            <tr className="h-[42px] border-b border-black/[0.08] bg-[#FAFAFA] text-left text-[10px] font-bold tracking-[0.12em] text-[#86868B] uppercase">
              <th className="w-[25%] px-5">Process</th>
              <th className="w-[16%] px-5">Tier</th>
              <th className="w-[18%] px-5">Automation</th>
              <th className="w-[13%] px-5">Cost / yr</th>
              <th className="w-[10%] px-5">FTEs</th>
              <th className="w-[10%] px-5 whitespace-nowrap">Software / yr</th>
              <th className="w-[13%] px-5 text-right">Est. saving</th>
            </tr>
          </thead>
          <tbody>
            {processes.length ? (
              processes.map((process) => {
                const processSectionKey = getProcessSectionKey(sectionKey, process);
                const isExpanded = expandedProcessKey === processSectionKey;

                return (
                  <Fragment key={processSectionKey}>
                    <ProcessRow
                      currencyConversionRate={assessment.currencyConversionRate}
                      expanded={isExpanded}
                      formatBaseCurrency={formatBaseCurrency}
                      getAutomationLabel={getAutomationLabel}
                      getProcessCostInBaseCurrency={getProcessCostInBaseCurrency}
                      getProcessFteLabel={getProcessFteLabel}
                      getProcessSavingInBaseCurrency={getProcessSavingInBaseCurrency}
                      getProcessSoftwareCostLabel={getProcessSoftwareCostLabel}
                      process={process}
                      onToggle={() => toggleProcessPreview(processSectionKey, isExpanded)}
                    />
                    {isExpanded ? (
                      <tr>
                        <td colSpan={7} className="border-b border-black/[0.05] bg-[#FAFAFA] p-0">
                          <AssessmentProcessPreview
                            currencyConversionRate={assessment.currencyConversionRate}
                            formatBaseCurrency={formatBaseCurrency}
                            formatCurrencyAmountInBaseCurrency={formatCurrencyAmountInBaseCurrency}
                            formatNumberInput={formatNumberInput}
                            formatPercentValue={formatPercentValue}
                            getProcessAuditLabel={getProcessAuditLabel}
                            getProcessCostInBaseCurrency={getProcessCostInBaseCurrency}
                            getProcessSoftwareCostLabel={getProcessSoftwareCostLabel}
                            process={process}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="h-28 px-5 text-center text-sm font-semibold text-[#86868B]">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="mt-6 overflow-hidden rounded-md border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.08] px-5 py-4">
          <p className="text-[10px] font-bold tracking-[0.14em] text-[#86868B] uppercase">
            Selected processes ({selectedProcesses.length})
          </p>
        </div>
        {renderProcessTable(
          selectedProcesses,
          "selected",
          "Selected process details are not available for this assessment yet.",
        )}
      </section>

      {customProcesses.length ? (
        <section className="mt-4 overflow-hidden rounded-md border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.08] px-5 py-4">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#86868B] uppercase">
              Custom processes ({customProcesses.length})
            </p>
          </div>
          {renderProcessTable(
            customProcesses,
            "custom",
            "Custom process details are not available for this assessment yet.",
          )}
        </section>
      ) : null}
    </>
  );
}

function ProcessRow({
  currencyConversionRate,
  expanded,
  formatBaseCurrency,
  getAutomationLabel,
  getProcessCostInBaseCurrency,
  getProcessFteLabel,
  getProcessSavingInBaseCurrency,
  getProcessSoftwareCostLabel,
  onToggle,
  process,
}: {
  currencyConversionRate: number;
  expanded: boolean;
  formatBaseCurrency: ProcessFormatters["formatBaseCurrency"];
  getAutomationLabel: ProcessFormatters["getAutomationLabel"];
  getProcessCostInBaseCurrency: ProcessFormatters["getProcessCostInBaseCurrency"];
  getProcessFteLabel: ProcessFormatters["getProcessFteLabel"];
  getProcessSavingInBaseCurrency: ProcessFormatters["getProcessSavingInBaseCurrency"];
  getProcessSoftwareCostLabel: ProcessFormatters["getProcessSoftwareCostLabel"];
  onToggle: () => void;
  process: AdminAssessmentProcess;
}) {
  const automationLevel = Math.min(5, Math.max(1, Number(process.automationLevel) || 1));
  const processBaseCurrencyCost = getProcessCostInBaseCurrency(process, currencyConversionRate);
  const processBaseCurrencySaving = getProcessSavingInBaseCurrency(process, processBaseCurrencyCost);

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  }

  return (
    <tr
      className="h-[58px] cursor-pointer border-b border-black/[0.05] transition last:border-b-0 hover:bg-[#FAFAFA]"
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-expanded={expanded}
    >
      <td className="px-5 py-3">
        <p className="truncate text-xs font-bold text-[#171717]">
          <span className="mr-2 inline-block text-[#86868B]">{expanded ? "âˆ’" : "+"}</span>
          {process.name || process.processId || "--"}
        </p>
        <p className="mt-1 truncate text-[10px] font-semibold text-[#86868B]">{process.category || "--"}</p>
      </td>
      <td className="px-5 py-3">
        <span className="inline-flex h-6 items-center rounded-full bg-[#ECFDF5] px-2.5 text-[10px] font-bold text-[#10B981]">
          {process.tier || "--"}
        </span>
      </td>
      <td className="px-5 py-3 text-[11px] font-semibold text-[#555555]">
        <span className="mr-1 inline-flex size-4 items-center justify-center rounded bg-[#FF8A3D] text-[9px] font-bold text-white">
          {automationLevel}
        </span>
        {process.automation || getAutomationLabel(automationLevel)}
      </td>
      <td className="px-5 py-3 text-[11px] font-bold text-[#171717]">{formatBaseCurrency(processBaseCurrencyCost)}</td>
      <td className="px-5 py-3 text-[11px] font-bold text-[#555555]">{getProcessFteLabel(process)}</td>
      <td className="px-5 py-3 text-[11px] font-bold text-[#555555]">{getProcessSoftwareCostLabel(process, currencyConversionRate)}</td>
      <td className="px-5 py-3 text-right text-[11px] font-bold text-[#10B981]">{formatBaseCurrency(processBaseCurrencySaving)}</td>
    </tr>
  );
}

function AssessmentProcessMobileCard({
  currencyConversionRate,
  expanded,
  formatBaseCurrency,
  getAutomationLabel,
  getProcessAuditLabel,
  getProcessCostInBaseCurrency,
  getProcessFteLabel,
  getProcessSavingInBaseCurrency,
  getProcessSoftwareCostLabel,
  onToggle,
  process,
}: {
  currencyConversionRate: number;
  expanded: boolean;
  formatBaseCurrency: ProcessFormatters["formatBaseCurrency"];
  getAutomationLabel: ProcessFormatters["getAutomationLabel"];
  getProcessAuditLabel: ProcessFormatters["getProcessAuditLabel"];
  getProcessCostInBaseCurrency: ProcessFormatters["getProcessCostInBaseCurrency"];
  getProcessFteLabel: ProcessFormatters["getProcessFteLabel"];
  getProcessSavingInBaseCurrency: ProcessFormatters["getProcessSavingInBaseCurrency"];
  getProcessSoftwareCostLabel: ProcessFormatters["getProcessSoftwareCostLabel"];
  onToggle: () => void;
  process: AdminAssessmentProcess;
}) {
  const automationLevel = Math.min(5, Math.max(1, Number(process.automationLevel) || 1));
  const processBaseCurrencyCost = getProcessCostInBaseCurrency(process, currencyConversionRate);
  const processBaseCurrencySaving = getProcessSavingInBaseCurrency(process, processBaseCurrencyCost);
  const auditLabel = getProcessAuditLabel(process);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="w-full bg-white px-4 py-4 text-left transition hover:bg-[#FAFAFA]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-[#171717]">
            {process.name || process.processId || "--"}
          </p>
          <p className="mt-1 break-words text-[11px] font-semibold text-[#86868B]">
            {process.category || "--"}
          </p>
          {auditLabel ? (
            <p className="mt-1 break-words text-[10px] font-semibold text-[#A1A1AA]">
              {auditLabel}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-bold text-[#10B981]">
          {process.tier || "--"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <MobileMetric label="Automation" value={`${automationLevel} - ${process.automation || getAutomationLabel(automationLevel)}`} />
        <MobileMetric label="Cost / yr" value={formatBaseCurrency(processBaseCurrencyCost)} />
        <MobileMetric label="FTEs" value={getProcessFteLabel(process)} />
        <MobileMetric label="Software / yr" value={getProcessSoftwareCostLabel(process, currencyConversionRate)} />
        <div className="col-span-2 rounded-md bg-[#F8FAFC] px-3 py-2">
          <p className="text-[9px] font-bold tracking-[0.12em] text-[#8E9AAB] uppercase">
            Est. saving
          </p>
          <p className="mt-1 text-xs font-bold text-[#10B981]">
            {formatBaseCurrency(processBaseCurrencySaving)}
          </p>
        </div>
      </div>

      <span className="mt-3 inline-flex text-[11px] font-bold text-[#007AFF]">
        {expanded ? "Hide details" : "View details"}
      </span>
    </button>
  );
}

function AssessmentProcessPreview({
  currencyConversionRate,
  formatBaseCurrency,
  formatCurrencyAmountInBaseCurrency,
  formatNumberInput,
  formatPercentValue,
  getProcessAuditLabel,
  getProcessCostInBaseCurrency,
  getProcessSoftwareCostLabel,
  process,
}: {
  currencyConversionRate: number;
  formatBaseCurrency: ProcessFormatters["formatBaseCurrency"];
  formatCurrencyAmountInBaseCurrency: ProcessFormatters["formatCurrencyAmountInBaseCurrency"];
  formatNumberInput: ProcessFormatters["formatNumberInput"];
  formatPercentValue: ProcessFormatters["formatPercentValue"];
  getProcessAuditLabel: ProcessFormatters["getProcessAuditLabel"];
  getProcessCostInBaseCurrency: ProcessFormatters["getProcessCostInBaseCurrency"];
  getProcessSoftwareCostLabel: ProcessFormatters["getProcessSoftwareCostLabel"];
  process: AdminAssessmentProcess;
}) {
  const automationLevel = Math.min(5, Math.max(1, Number(process.automationLevel) || 1));
  const costInputs = process.costInputs;
  const sharedFtePool = costInputs?.sharedFtePool;
  const dedicatedFte = costInputs?.dedicatedFte;
  const serviceLevel = costInputs?.serviceLevel;
  const hasServiceLevel =
    Number.isFinite(serviceLevel?.requestVolume) || Number.isFinite(serviceLevel?.turnaroundTime);
  const totalBaseCurrencyCost = getProcessCostInBaseCurrency(process, currencyConversionRate);
  const auditLabel = getProcessAuditLabel(process);
  const processName = process.name || process.processId || "Selected process";
  const stackLabel = process.stack?.length ? process.stack.join(", ") : "--";

  return (
    <div className="p-3 sm:p-5">
      <div className="rounded-md border border-black/[0.08] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.08] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#171717]">
              {processName}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-[#86868B]">
              Assessment process details{auditLabel ? ` - ${auditLabel}` : ""}
            </p>
          </div>
          <p className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-bold text-[#007AFF]">
            {formatBaseCurrency(totalBaseCurrencyCost)} / yr
          </p>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <PreviewField label="Process efficiency %" value={formatPercentValue(costInputs?.efficiencyPercent)} />
          <Field label="Digitization level">
            <div className="grid grid-cols-5 overflow-hidden rounded-md border border-black/[0.08]">
              {automationLevelOptions.map((level) => (
                <span
                  key={level}
                  aria-current={automationLevel === level ? "true" : undefined}
                  className={`flex h-9 items-center justify-center border-r border-black/[0.08] text-xs font-bold last:border-r-0 ${
                    automationLevel === level
                      ? "bg-[#10B981] text-white"
                      : "bg-[#F8FAFC] text-[#555555]"
                  }`}
                >
                  {level}
                </span>
              ))}
            </div>
          </Field>
          <PreviewField label="Process name" value={processName} />
          <div className="grid gap-4 sm:grid-cols-2">
            <PreviewField label="Category" value={process.category || "--"} />
            <PreviewField label="Tier" value={process.tier || "--"} />
          </div>
          <PreviewField className="lg:col-span-2" label="Description" multiline value={process.description || "--"} />
        </div>

        <div className="grid gap-4 border-t border-black/[0.08] p-4 lg:grid-cols-2">
          <section className="rounded-md border border-black/[0.08] bg-[#FAFAFA] p-4">
            <p className="text-[10px] font-bold tracking-[0.12em] text-[#86868B] uppercase">
              FTE & staffing
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <PreviewField label="Shared FTE pool" value={formatNumberInput(sharedFtePool?.count) || "--"} />
              <PreviewField
                label="Shared salary / FTE"
                value={formatCurrencyAmountInBaseCurrency(sharedFtePool?.annualSalaryPerFte, currencyConversionRate)}
              />
              <PreviewField label="Allocation for this process %" value={formatPercentValue(sharedFtePool?.allocationPercent)} />
              <PreviewField label="Dedicated FTEs" value={formatNumberInput(dedicatedFte?.count) || "--"} />
              <PreviewField
                label="Dedicated salary / FTE"
                value={formatCurrencyAmountInBaseCurrency(dedicatedFte?.annualSalaryPerFte, currencyConversionRate)}
              />
              <PreviewField label="Est. hours / year" value={formatNumberInput(process.hoursPerYear) || "--"} />
            </div>
          </section>
          <section className="rounded-md border border-black/[0.08] bg-[#FAFAFA] p-4">
            <p className="text-[10px] font-bold tracking-[0.12em] text-[#86868B] uppercase">
              Technology cost & stack
            </p>
            <div className="mt-3 grid gap-3">
              <PreviewField label="Software cost / yr" value={getProcessSoftwareCostLabel(process, currencyConversionRate)} />
              <PreviewField label="Technology stack" multiline value={stackLabel} />
            </div>
          </section>
          {hasServiceLevel ? (
            <section className="rounded-md border border-black/[0.08] bg-[#FAFAFA] p-4 lg:col-span-2">
              <p className="text-[10px] font-bold tracking-[0.12em] text-[#86868B] uppercase">
                Service level
              </p>
              <p className="mt-1 text-[10px] font-semibold text-[#A1A1AA]">
                Reference only; not included in cost calculations.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <PreviewField
                  label="Request volume"
                  value={formatRequestVolume(
                    serviceLevel?.requestVolume,
                    serviceLevel?.requestVolumeUnit,
                  )}
                />
                <PreviewField
                  label="Turnaround time"
                  value={formatTurnaroundTime(
                    serviceLevel?.turnaroundTime,
                    serviceLevel?.turnaroundTimeUnit,
                  )}
                />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatRequestVolume(
  value: number | undefined,
  unit: "hour" | "day" | "month" | undefined,
) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${value} / ${unit || "day"}`;
}

function formatTurnaroundTime(
  value: number | undefined,
  unit: "minutes" | "hours" | "days" | "custom" | undefined,
) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${value} ${unit || "hours"}`;
}

function PreviewField({
  className = "",
  label,
  multiline = false,
  value,
}: {
  className?: string;
  label: string;
  multiline?: boolean;
  value: string;
}) {
  return (
    <Field className={className} label={label}>
      <p
        className={`${detailValueClass} ${
          multiline ? "min-h-20 whitespace-pre-wrap" : "flex items-center"
        }`}
      >
        {value || "--"}
      </p>
    </Field>
  );
}

function Field({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[9px] font-bold tracking-[0.12em] text-[#86868B] uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
