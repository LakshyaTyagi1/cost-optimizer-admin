"use client";

import type { DetailTab } from "@/features/assessments/view-model";

const tabs: Array<{ label: string; value: DetailTab }> = [
  { label: "Overview", value: "overview" },
  { label: "Activity", value: "activity" },
  { label: "Processes", value: "processes" },
  { label: "Due Diligence", value: "due-diligence" },
  { label: "Results", value: "results" },
  { label: "Strategy & RFP", value: "strategy" },
  { label: "Expert", value: "expert" },
  { label: "Notes", value: "notes" },
];

export function AssessmentTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}) {
  return (
    <div
      className="scrollbar-hidden mt-7 flex overflow-x-auto whitespace-nowrap border-b border-black/[0.08]"
      role="tablist"
      aria-label="Assessment detail sections"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;

        return (
          <button
            key={tab.value}
            type="button"
            id={`assessment-tab-${tab.value}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`assessment-tab-panel-${tab.value}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.value)}
            className={`h-12 shrink-0 px-3 text-sm leading-none font-semibold transition sm:px-4 sm:text-[16px] sm:font-normal ${
              isActive
                ? "border-b border-[#171717] text-[#171717]"
                : "text-[#86868B] hover:text-[#171717]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
