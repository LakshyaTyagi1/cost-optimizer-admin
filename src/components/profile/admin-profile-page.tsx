"use client";

import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  IdCard,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/admin-shell/admin-shell";
import { useAuth } from "@/components/auth/auth-provider";
import type { AdminUser } from "@/lib/auth/storage";

export function AdminProfilePage() {
  const { user } = useAuth();
  const displayName = getDisplayName(user);
  const email = user?.email_id?.trim() || "Not available";
  const profileImageUrl = user?.profile_pic_url?.trim() || user?.profilePicUrl?.trim() || "";
  const accessRoles = getAccessRoles(user?.user_access);

  return (
    <AdminShell activeItem="Profile">
      <div className="max-w-full overflow-hidden lg:pr-6">
        <header className="rounded-lg border border-black/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <ProfileAvatar
              displayName={displayName}
              initials={getInitials(user)}
              profileImageUrl={profileImageUrl}
            />

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF3FF] px-3 py-1 text-[11px] font-semibold tracking-[0.06em] text-[#005DB8] uppercase">
                <ShieldCheck size={13} aria-hidden="true" />
                Administrator account
              </div>
              <h1 className="mt-3 truncate text-[26px] leading-[39px] font-semibold tracking-[0.22px] text-[#171717]">
                {displayName}
              </h1>
              <p className="mt-1 text-[13px] leading-[19.5px] break-all text-[#86868B]">{email}</p>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <section className="rounded-lg border border-black/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-6">
            <SectionHeading
              description="Identity details supplied by the authenticated admin account."
              icon={UserRound}
              title="Account details"
            />

            <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <ProfileDetail label="First name" value={user?.first_name} />
              <ProfileDetail label="Last name" value={user?.last_name} />
              <ProfileDetail icon={Mail} label="Email address" value={user?.email_id} />
              <ProfileDetail icon={BriefcaseBusiness} label="Job title" value={user?.job_title} />
              <ProfileDetail icon={Building2} label="Company" value={user?.company} />
              <ProfileDetail label="Industry" value={user?.industry} />
              <ProfileDetail
                className="sm:col-span-2"
                icon={IdCard}
                label="Administrator ID"
                value={user?._id}
              />
            </dl>
          </section>

          <div className="grid gap-4">
            <section className="rounded-lg border border-black/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-6">
              <SectionHeading
                description="Console permissions attached to this account."
                icon={BadgeCheck}
                title="Access and permissions"
              />

              <div className="mt-5 flex flex-wrap gap-2">
                {accessRoles.length ? (
                  accessRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3FF] px-3 py-1.5 text-xs font-semibold text-[#005DB8]"
                    >
                      <CheckCircle2 size={13} aria-hidden="true" />
                      {formatAccessRole(role)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#86868B]">No access role is assigned.</span>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-black/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-6">
              <SectionHeading
                description="Current access is protected by the shared admin authentication session."
                icon={ShieldCheck}
                title="Account security"
              />

              <div className="mt-5 flex items-center justify-between gap-4 rounded-md bg-[#F8FAFC] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-[#171717]">Session status</p>
                  <p className="mt-1 text-[11px] text-[#86868B]">Authenticated in this browser</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087A58]">
                  <span className="size-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
                  Active
                </span>
              </div>
            </section>
          </div>
        </div>

        <section className="mt-4 rounded-lg border border-black/[0.08] bg-[#F8FAFC] p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#171717]">Profile management</h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-[#555555]">
            Profile details are synchronized from the administrator identity service. Editing,
            password changes, and profile-photo updates are not available in this console yet.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}

function SectionHeading({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: typeof UserRound;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#F5F5F7] text-[#555555]">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-[#171717]">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#86868B]">{description}</p>
      </div>
    </div>
  );
}

function ProfileDetail({
  className = "",
  icon: Icon,
  label,
  value,
}: {
  className?: string;
  icon?: typeof UserRound;
  label: string;
  value?: string;
}) {
  return (
    <div className={`min-w-0 border-b border-black/[0.06] pb-4 ${className}`}>
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-[#86868B] uppercase">
        {Icon ? <Icon size={12} aria-hidden="true" /> : null}
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium break-words text-[#171717]">
        {value?.trim() || "—"}
      </dd>
    </div>
  );
}

function ProfileAvatar({
  displayName,
  initials,
  profileImageUrl,
}: {
  displayName: string;
  initials: string;
  profileImageUrl: string;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const shouldShowImage = Boolean(profileImageUrl) && failedImageUrl !== profileImageUrl;

  if (shouldShowImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={`${displayName} profile`}
        className="size-[72px] shrink-0 rounded-full border border-black/[0.08] object-cover shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
        height={72}
        onError={() => setFailedImageUrl(profileImageUrl)}
        referrerPolicy="no-referrer"
        src={profileImageUrl}
        width={72}
      />
    );
  }

  return (
    <span
      className="flex size-[72px] shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-xl font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.2)]"
      aria-label={`${displayName} initials`}
    >
      {initials}
    </span>
  );
}

function getDisplayName(user: AdminUser | null) {
  const fullName = [user?.first_name, user?.last_name]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  return (
    user?.email_id
      ?.split("@")[0]
      ?.replace(/[._-]+/g, " ")
      .trim() || "Admin User"
  );
}

function getInitials(user: AdminUser | null) {
  const nameInitials = [user?.first_name, user?.last_name]
    .map((value) => value?.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .join("")
    .slice(0, 2);

  if (nameInitials) {
    return nameInitials;
  }

  return user?.email_id?.trim().charAt(0).toUpperCase() || "AD";
}

function getAccessRoles(access: string | string[] | undefined) {
  if (Array.isArray(access)) {
    return access.map((role) => role.trim()).filter(Boolean);
  }

  return access?.trim() ? [access.trim()] : [];
}

function formatAccessRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
