import type { DashboardDataQuery } from "@/features/dashboard/queries";
import type { DashboardViewData } from "@/features/dashboard/utils/dashboard-view-data";

export type DashboardQueryProps = {
  dashboardQuery: DashboardDataQuery;
  dashboardViewData: DashboardViewData;
};
