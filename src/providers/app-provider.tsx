"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/providers/auth-provider";
import { ReactQueryProvider } from "@/providers/query-provider";
import { RouteProgressBar } from "@/components/route-progress/route-progress-bar";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <RouteProgressBar />
      <AuthProvider>{children}</AuthProvider>
    </ReactQueryProvider>
  );
}
