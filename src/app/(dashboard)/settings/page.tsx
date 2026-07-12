import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  CircleDollarSign,
  FileText,
  LockKeyhole,
  Plug,
  Settings2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell/admin-shell";

export const metadata: Metadata = {
  title: "Settings | Cost Optimizer Admin",
  description:
    "Review administrative settings for the Cost Optimizer console, including currency, access, notifications, integrations, and report configuration.",
};

const settingsSections = [
  {
    title: "Currency and benchmarks",
    description:
      "Maintain the USD to AED conversion rate and customer-facing benchmark assumptions from the data dictionary.",
    icon: CircleDollarSign,
    status: "Managed in Data Dictionary",
    href: "/data-dictionary",
  },
  {
    title: "Access and roles",
    description:
      "Review admin access ownership, role policy, and team permissions before enabling team management flows.",
    icon: UsersRound,
    status: "Planned",
  },
  {
    title: "Security controls",
    description:
      "Session, token, and protected-route behavior are enforced by the shared admin authentication provider.",
    icon: ShieldCheck,
    status: "Active",
  },
  {
    title: "Notifications",
    description:
      "Configure assessment alerts, expert handoff reminders, and internal review notifications when workflows are connected.",
    icon: Bell,
    status: "Planned",
  },
  {
    title: "Report outputs",
    description:
      "Define PDF, Word, Strategy Report, and Scope/RFP export defaults once document generation is live.",
    icon: FileText,
    status: "Pending reports",
  },
  {
    title: "Integrations",
    description:
      "Connect booking, CRM, assistant, and downstream workflow integrations from this area in a later phase.",
    icon: Plug,
    status: "Planned",
  },
];

export default function SettingsRoutePage() {
  return (
    <AdminShell activeItem="Settings">
      <div className="max-w-full overflow-hidden lg:pr-6">
        <header className="flex flex-col gap-4 rounded-lg border border-black/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F5F7] px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-[#555555] uppercase">
                <Settings2 size={13} aria-hidden="true" />
                Admin controls
              </div>
              <h1 className="mt-4 text-[26px] leading-tight font-bold tracking-normal text-[#171717]">
                Settings
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 font-semibold text-[#86868B]">
                Central place for console configuration. This page is intentionally
                lightweight today so existing dashboard, assessment, and data
                dictionary workflows stay untouched.
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Settings sections">
          {settingsSections.map((section) => {
            const Icon = section.icon;

            return (
              <article
                className="flex min-h-[210px] flex-col rounded-lg border border-black/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                key={section.title}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F7] text-[#171717]">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[10px] font-bold tracking-[0.06em] text-[#555555] uppercase">
                    {section.status}
                  </span>
                </div>

                <div className="mt-5 flex flex-1 flex-col">
                  <h2 className="text-sm leading-5 font-bold text-[#171717]">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-xs leading-5 font-semibold text-[#86868B]">
                    {section.description}
                  </p>

                  {section.href ? (
                    <Link
                      className="mt-auto inline-flex w-max items-center rounded-md text-xs font-bold text-[#007AFF] transition hover:text-[#0057B8]"
                      href={section.href}
                      prefetch={false}
                    >
                      Open related area -&gt;
                    </Link>
                  ) : (
                    <p className="mt-auto text-xs font-bold text-[#A1A1AA]">
                      Configuration flow not connected yet
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-lg border border-black/[0.08] bg-[#F5F5F7] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#171717]">
                <LockKeyhole size={15} aria-hidden="true" />
                Safe implementation note
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 font-semibold text-[#555555]">
                This route does not introduce new API mutations or settings
                persistence. Live configuration continues to use the existing
                data dictionary and backend contracts.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
