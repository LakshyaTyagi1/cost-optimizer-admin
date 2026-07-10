import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { fetchDashboardData } from "@/features/dashboard/api";

export const dashboardQueryKey = ["admin-dashboard"] as const;

export type DashboardData = Awaited<ReturnType<typeof fetchDashboardData>>;
export type DashboardDataQuery = UseQueryResult<DashboardData, Error>;

export function useDashboardData(): DashboardDataQuery {
  return useQuery<DashboardData, Error>({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
  });
}
