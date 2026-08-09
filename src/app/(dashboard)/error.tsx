"use client";

import { ArrowLeft, CircleAlert, LayoutDashboard, RefreshCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { AdminShell } from "@/components/admin-shell/admin-shell";

const adminNavigationItems = [
  { path: "/assessments", label: "Assessments" },
  { path: "/data-dictionary", label: "Data Dictionary" },
  { path: "/experts", label: "Experts" },
  { path: "/archive", label: "Archive" },
  { path: "/settings", label: "Settings" },
] as const;

function getActiveNavigationItem(pathname: string) {
  return (
    adminNavigationItems.find(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
    )?.label ?? "Dashboard"
  );
}

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeItem = getActiveNavigationItem(pathname);

  useEffect(() => {
    console.error("Cost Optimizer Admin dashboard error", error);
  }, [error]);

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }, [router]);

  return (
    <AdminShell activeItem={activeItem}>
      <section
        aria-labelledby="admin-error-title"
        className="flex min-h-[calc(100dvh-2rem)] items-center justify-center pr-0 sm:min-h-[calc(100dvh-3.75rem)] sm:pr-6 lg:min-h-[calc(100dvh-3rem)] lg:pr-6"
      >
        <div
          role="alert"
          className="w-full max-w-[620px] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
        >
          <div className="px-4 pt-7 pb-6 text-center min-[380px]:px-5 sm:px-10 sm:pt-9 sm:pb-8">
            <div className="relative mx-auto h-[86px] w-[118px]" aria-hidden="true">
              <div className="absolute inset-x-0 top-0 h-[75px] overflow-hidden rounded-lg border border-black/[0.12] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.09)]">
                <div className="flex h-5 items-center gap-1 border-b border-black/[0.08] bg-[#F7F8FA] px-2">
                  <span className="size-1.5 rounded-full bg-[#FF6B6B]" />
                  <span className="size-1.5 rounded-full bg-[#FFBD45]" />
                  <span className="size-1.5 rounded-full bg-[#60C77A]" />
                  <span className="ml-1 h-1.5 flex-1 rounded-full bg-black/[0.06]" />
                </div>
                <div className="space-y-2 px-3 pt-3">
                  <div className="h-1.5 w-3/5 rounded-full bg-black/[0.07]" />
                  <div className="h-1.5 w-full rounded-full bg-black/[0.05]" />
                  <div className="h-1.5 w-4/5 rounded-full bg-black/[0.05]" />
                </div>
              </div>
              <span className="absolute right-0 bottom-0 flex size-10 items-center justify-center rounded-full border-[3px] border-white bg-[#FFF4E8] text-[#F97316] shadow-[0_5px_16px_rgba(249,115,22,0.22)]">
                <TriangleAlert size={20} strokeWidth={2.2} />
              </span>
            </div>

            <h1
              id="admin-error-title"
              className="mx-auto mt-5 max-w-[470px] text-[21px] leading-[1.25] font-bold tracking-[-0.45px] text-[#171717] min-[380px]:text-[23px] sm:mt-6 sm:text-[28px] sm:tracking-[-0.7px]"
            >
              We couldn&apos;t load this admin page
            </h1>
            <p className="mx-auto mt-2.5 max-w-[480px] text-[13px] leading-5 font-medium text-[#68686D] sm:mt-3 sm:text-sm sm:leading-6">
              Something interrupted the page while it was loading. Retry now, go back, or return to
              the dashboard to continue.
            </p>

            <div className="mx-auto mt-5 flex max-w-[500px] items-start gap-3 rounded-lg border border-[#007AFF]/15 bg-[#F2F7FF] px-3.5 py-3 text-left sm:mt-6 sm:px-4 sm:py-3.5">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#007AFF]/10 text-[#007AFF]">
                <CircleAlert size={15} strokeWidth={2.1} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] leading-4.5 font-bold text-[#171717] sm:text-[13px]">
                  No changes were submitted.
                </p>
                <p className="mt-0.5 text-[11px] leading-4.5 font-medium text-[#68686D] sm:text-xs sm:leading-5">
                  No admin changes were submitted from this failed page view.
                </p>
              </div>
            </div>

            <div className="mx-auto mt-5 grid max-w-[500px] grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-2">
              <button
                type="button"
                onClick={unstable_retry}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#007AFF] px-4 text-xs font-bold text-white transition-colors hover:bg-[#006BE0] focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 sm:h-9"
              >
                <RefreshCcw size={13} strokeWidth={2.2} aria-hidden="true" />
                Retry Page
              </button>
              <button
                type="button"
                onClick={handleGoBack}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-black/[0.09] bg-white px-4 text-xs font-bold text-[#555555] transition-colors hover:border-[#007AFF]/30 hover:bg-[#F8FAFF] hover:text-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 sm:h-9"
              >
                <ArrowLeft size={13} strokeWidth={2.2} aria-hidden="true" />
                Go Back
              </button>
              <Link
                href="/"
                prefetch={false}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-black/[0.09] bg-white px-4 text-xs font-bold text-[#555555] transition-colors hover:border-[#007AFF]/30 hover:bg-[#F8FAFF] hover:text-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 sm:h-9"
              >
                <LayoutDashboard size={13} strokeWidth={2.2} aria-hidden="true" />
                Dashboard
              </Link>
            </div>
          </div>

          <footer className="border-t border-black/[0.06] bg-[#FAFAFB] px-4 py-3 text-center sm:px-8">
            <p className="text-[10px] leading-4 font-medium text-[#86868B] sm:text-[11px]">
              If the problem persists, please contact support.
            </p>
          </footer>
        </div>
      </section>
    </AdminShell>
  );
}
