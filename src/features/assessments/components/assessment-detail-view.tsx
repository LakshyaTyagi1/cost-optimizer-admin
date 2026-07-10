"use client";

import type { ReactNode } from "react";
import {
  ArrowLeft,
  Printer,
  Trash2,
} from "lucide-react";

import { AssessmentDetailMetric } from "@/features/assessments/components/assessment-detail-metric";
import { AssessmentStatusPill as StatusPill } from "@/features/assessments/components/assessment-status-pill";
import { AssessmentTabs } from "@/features/assessments/components/assessment-tabs";
import { getStatusTone } from "@/features/assessments/utils/status";
import type {
  AssessmentSummary,
  DetailTab,
} from "@/features/assessments/view-model";

type AssessmentMetric = {
  label: string;
  value: string;
};

export function AssessmentDetailView({
  activeTab,
  assessment,
  children,
  metrics,
  onBack,
  onPrint,
  onTabChange,
}: {
  activeTab: DetailTab;
  assessment: AssessmentSummary;
  children: ReactNode;
  metrics: AssessmentMetric[];
  onBack: () => void;
  onPrint: () => void;
  onTabChange: (tab: DetailTab) => void;
}) {
  const statusTone = getStatusTone(assessment.status, assessment.statusKey);

  return (
    <section className="min-h-[calc(100vh-56px)] bg-white px-4 py-6 text-[#171717] sm:px-5 sm:py-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#86868B] transition hover:text-[#007AFF]"
      >
        <ArrowLeft size={12} aria-hidden="true" />
        Back to assessments
      </button>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 sm:flex-1">
          <h1 className="break-words text-[24px] leading-tight font-bold tracking-normal sm:text-[26px]">
            {assessment.company}
          </h1>
          <p className="mt-1 break-words text-xs font-semibold text-[#86868B]">
            {assessment.contact}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#86868B]">
            <StatusPill label={assessment.status} tone={statusTone} />
            <span>
              Owner: <span className="text-[#171717]">{assessment.owner}</span>
            </span>
            <span>Created {formatDetailDate(assessment.createdAt)}</span>
            <span>Updated {formatDetailDate(assessment.updatedAt)}</span>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#555555] transition hover:border-[#007AFF]/30 hover:text-[#007AFF] sm:w-auto"
          >
            <Printer size={13} aria-hidden="true" />
            Export PDF
          </button>
          {/* <div className="hidden h-9 w-[180px] rounded-md border border-black/[0.08] bg-white sm:block" aria-hidden="true" /> */}
          <button
            type="button"
            disabled
            className="inline-flex size-9 cursor-not-allowed items-center justify-center rounded-md border border-black/[0.08] text-[#8E9AAB]"
            aria-label="Delete assessment"
          >
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {metrics.map((metric) => (
          <AssessmentDetailMetric
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </div>

      <AssessmentTabs activeTab={activeTab} onTabChange={onTabChange} />

      <div
        id={`assessment-tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`assessment-tab-${activeTab}`}
        className="outline-none"
      >
        {children}
      </div>
    </section>
  );
}

function formatDetailDate(value?: string) {
  const date = new Date(value || "");

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
