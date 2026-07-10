import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin-dashboard/admin-dashboard";

export const metadata: Metadata = {
  title: "Business Dashboard | Cost Optimizer Admin",
  description:
    "Monitor cost optimization assessments, pipeline status, savings, industry trends, and recently updated assessment activity.",
};

export default function Home() {
  return <AdminDashboard />;
}
