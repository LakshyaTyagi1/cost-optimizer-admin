"use client";

import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  LogOut,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import type { AdminUser } from "@/lib/auth/storage";

type NavigationLabel =
  | "Dashboard"
  | "Assessments"
  | "Data Dictionary"
  | "Experts"
  | "Team"
  | "Archive"
  | "Settings";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: NavigationLabel;
};

const navigationItems: readonly NavigationItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Data Dictionary", href: "/data-dictionary", icon: BookOpen },
  { label: "Experts", href: "/experts", icon: Users },
  { label: "Team", href: "#team", icon: UserRound },
  { label: "Archive", href: "/archive", icon: Archive },
  { label: "Settings", href: "#settings", icon: Settings },
];

export function AdminShell({
  activeItem,
  children,
}: {
  activeItem: NavigationLabel;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <MobileNavigation activeItem={activeItem} />
      <div className="grid min-h-[calc(100vh-56px)] lg:min-h-screen lg:grid-cols-[220px_minmax(0,1fr)]">
        <Sidebar activeItem={activeItem} />
        <section id="admin-main-content" tabIndex={-1} className="min-w-0 bg-white">
          <div className="h-full px-4 pt-6 pb-6 sm:px-6 sm:pt-8 lg:ml-6 lg:max-w-none lg:px-0 lg:pt-8 lg:pb-4">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function MobileNavigation({ activeItem }: { activeItem: NavigationLabel }) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const adminName = getAdminDisplayName(user);
  const adminEmail = user?.email_id?.trim() || "Admin console";
  const initials = getAdminInitials(user);
  const profileImageUrl = getAdminProfileImageUrl(user);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleLogout() {
    setIsOpen(false);
    logout();
    router.replace("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-black/[0.08] bg-white px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-black text-white">
            <ShieldCheck size={17} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Admin Panel</p>
            <p className="truncate text-[11px] font-semibold text-[#86868B]">
              {activeItem}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-controls="mobile-admin-navigation"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close admin navigation" : "Open admin navigation"}
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          className="inline-flex size-10 items-center justify-center rounded-md border border-black/[0.08] bg-white text-[#171717]"
        >
          {isOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </header>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            aria-label="Close admin navigation"
            className="absolute inset-0 h-full w-full bg-black/30"
            onClick={() => setIsOpen(false)}
          />
          <aside
            id="mobile-admin-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 flex w-[min(320px,calc(100vw-32px))] flex-col bg-white shadow-[18px_0_60px_rgba(15,23,42,0.18)]"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-black/[0.08] px-4">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-black text-white">
                  <ShieldCheck size={17} aria-hidden="true" />
                </div>
                <p className="truncate text-sm font-bold">Admin Panel</p>
              </div>
              <button
                type="button"
                aria-label="Close admin navigation"
                onClick={() => setIsOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-md text-[#86868B] hover:bg-black/[0.04] hover:text-[#171717]"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <nav className="space-y-1 overflow-y-auto px-3 py-4" aria-label="Mobile primary navigation">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = item.label === activeItem;
                const className = `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-bold transition ${
                  active
                    ? "bg-[#007AFF] text-white"
                    : "text-[#555555] hover:bg-black/[0.04] hover:text-[#171717]"
                }`;

                if (item.href.startsWith("#")) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className={className}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {item.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    prefetch={false}
                    className={className}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-black/[0.08] p-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <AdminAvatar initials={initials} name={adminName} profileImageUrl={profileImageUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{adminName}</p>
                  <p className="truncate text-xs text-[#86868B]">{adminEmail}</p>
                </div>
              </div>
              <button
                type="button"
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 text-sm font-bold text-[#EF4444]"
                onClick={handleLogout}
              >
                <LogOut size={15} aria-hidden="true" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function Sidebar({ activeItem }: { activeItem: NavigationLabel }) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const adminName = getAdminDisplayName(user);
  const adminEmail = user?.email_id?.trim() || "Admin console";
  const initials = getAdminInitials(user);
  const profileImageUrl = getAdminProfileImageUrl(user);

  function handleLogout() {
    setShowProfileMenu(false);
    logout();
    router.replace("/login");
  }

  return (
    <aside className="hidden border-r border-black/[0.08] bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-black/[0.08] px-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-black text-white">
          <ShieldCheck size={16} aria-hidden="true" />
        </div>
        <p className="text-[15px] leading-none font-bold">Admin Panel</p>
      </div>

      <nav className="space-y-1 px-3 py-4" aria-label="Primary navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = item.label === activeItem;
          const className = `flex h-9 items-center gap-3 rounded-md px-3 text-sm font-bold transition ${
            active
              ? "bg-[#007AFF] text-white"
              : "text-[#555555] hover:bg-black/[0.04] hover:text-[#171717]"
          }`;

          if (item.href.startsWith("#")) {
            return (
              <a key={item.label} href={item.href} className={className}>
                <Icon size={15} aria-hidden="true" />
                {item.label}
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              prefetch={false}
              className={className}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={15} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto min-h-[93px] border-t border-black/[0.08] px-5 py-4">
        {showProfileMenu ? (
          <div
            id="desktop-admin-profile-menu"
            role="menu"
            className="absolute right-3 bottom-[96px] left-3 rounded-md border border-black/[0.08] bg-white p-1 shadow-[0_8px_30px_rgba(15,23,42,0.12)]"
          >
            <button
              type="button"
              className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-bold text-[#EF4444] transition hover:bg-[#FEF2F2]"
              role="menuitem"
              onClick={handleLogout}
            >
              <LogOut size={14} aria-hidden="true" />
              Logout
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md text-left"
          aria-expanded={showProfileMenu}
          aria-controls="desktop-admin-profile-menu"
          aria-haspopup="menu"
          onClick={() => setShowProfileMenu((currentValue) => !currentValue)}
        >
          <AdminAvatar initials={initials} name={adminName} profileImageUrl={profileImageUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{adminName}</p>
            <p className="truncate text-xs text-[#86868B]">{adminEmail}</p>
          </div>
          <ChevronDown
            size={14}
            className={`shrink-0 text-[#86868B] transition ${showProfileMenu ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </aside>
  );
}

function getAdminDisplayName(user: AdminUser | null) {
  const fullName = [user?.first_name, user?.last_name]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  const emailName = user?.email_id
    ?.split("@")[0]
    ?.replace(/[._-]+/g, " ")
    .trim();

  return emailName || "Admin User";
}

function getAdminInitials(user: AdminUser | null) {
  const nameParts = [user?.first_name, user?.last_name]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (nameParts.length > 0) {
    return nameParts
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  const email = user?.email_id?.trim();

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "AD";
}

function AdminAvatar({
  initials,
  name,
  profileImageUrl,
}: {
  initials: string;
  name: string;
  profileImageUrl: string;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const shouldShowImage = Boolean(profileImageUrl) && failedImageUrl !== profileImageUrl;

  if (shouldShowImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={`${name} profile`}
        className="size-8 shrink-0 rounded-full border border-black/[0.06] object-cover"
        height={32}
        onError={() => setFailedImageUrl(profileImageUrl)}
        referrerPolicy="no-referrer"
        src={profileImageUrl}
        width={32}
      />
    );
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-xs font-bold text-white">
      {initials}
    </div>
  );
}

function getAdminProfileImageUrl(user: AdminUser | null) {
  return user?.profile_pic_url?.trim() || user?.profilePicUrl?.trim() || "";
}
