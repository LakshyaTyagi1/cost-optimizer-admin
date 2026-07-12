"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { AdminShell } from "@/components/admin-shell/admin-shell";
import { useDashboardData } from "@/features/dashboard/queries";
import { createDashboardViewData } from "@/features/dashboard/utils/dashboard-view-data";

import { DashboardDeferredSection } from "./dashboard-deferred-section";
import type { DashboardQueryProps } from "./dashboard-types";
import {
  PipelineConversionSectionSkeleton,
  PipelineValueSectionSkeleton,
  PortfolioSignalsSectionSkeleton,
  RecentAssessmentsSectionSkeleton,
} from "./sections/dashboard-section-skeletons";
import { DashboardHeader } from "./sections/dashboard-header";
import { DashboardStatsSection } from "./sections/dashboard-stats-section";
import { PipelineDistributionSection } from "./sections/pipeline-distribution-section";

const deferredDashboardSectionRootMargin = "360px 0px";

const LazyPipelineValueSection = dynamic<DashboardQueryProps>(
  () => import("./sections/pipeline-value-section"),
  {
    loading: () => <PipelineValueSectionSkeleton />,
    ssr: false,
  },
);

const LazyPipelineConversionSection = dynamic<DashboardQueryProps>(
  () => import("./sections/pipeline-conversion-section"),
  {
    loading: () => <PipelineConversionSectionSkeleton />,
    ssr: false,
  },
);

const LazyPortfolioSignalsSection = dynamic<DashboardQueryProps>(
  () => import("./sections/portfolio-signals-section"),
  {
    loading: () => <PortfolioSignalsSectionSkeleton />,
    ssr: false,
  },
);

const LazyRecentAssessmentsSection = dynamic<DashboardQueryProps>(
  () => import("./sections/recent-assessments-section"),
  {
    loading: () => <RecentAssessmentsSectionSkeleton />,
    ssr: false,
  },
);

export function AdminDashboard() {
  const dashboardQuery = useDashboardData();
  const dashboardViewData = useMemo(
    () => createDashboardViewData(dashboardQuery.data),
    [dashboardQuery.data],
  );
  const dashboardProps = { dashboardQuery, dashboardViewData };

  return (
    <AdminShell activeItem="Dashboard">
      <section className="min-w-0 lg:pr-6" aria-labelledby="business-dashboard-title">
        <DashboardHeader />

        <DashboardStatsSection {...dashboardProps} />
        <PipelineDistributionSection {...dashboardProps} />

        <DashboardDeferredSection
          fallback={<PipelineValueSectionSkeleton />}
          rootMargin={deferredDashboardSectionRootMargin}
        >
          <LazyPipelineValueSection {...dashboardProps} />
        </DashboardDeferredSection>

        <DashboardDeferredSection
          fallback={<PipelineConversionSectionSkeleton />}
          rootMargin={deferredDashboardSectionRootMargin}
        >
          <LazyPipelineConversionSection {...dashboardProps} />
        </DashboardDeferredSection>

        <DashboardDeferredSection
          fallback={<PortfolioSignalsSectionSkeleton />}
          rootMargin={deferredDashboardSectionRootMargin}
        >
          <LazyPortfolioSignalsSection {...dashboardProps} />
        </DashboardDeferredSection>

        <DashboardDeferredSection
          fallback={<RecentAssessmentsSectionSkeleton />}
          rootMargin={deferredDashboardSectionRootMargin}
        >
          <LazyRecentAssessmentsSection {...dashboardProps} />
        </DashboardDeferredSection>
      </section>
    </AdminShell>
  );
}
