import type { Metadata } from "next";

import { AdminProfilePage } from "@/components/profile/admin-profile-page";

export const metadata: Metadata = {
  title: "Admin Profile | Cost Optimizer Admin",
  description: "Review the signed-in administrator profile and console access details.",
};

export default function ProfileRoutePage() {
  return <AdminProfilePage />;
}
