"use client";

import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LogOut,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

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
  { label: "Settings", href: "/settings", icon: Settings },
];

const desktopSidebarTitleId = "desktop-admin-sidebar-title";
const mobileSidebarTitleId = "mobile-admin-sidebar-title";
const desktopProfileMenuId = "desktop-admin-profile-menu";
const mobileProfileMenuId = "mobile-admin-profile-menu";
const desktopSidebarStateStorageKey = "cost-optimizer-admin:desktop-sidebar-state";

function getInitialDesktopSidebarCollapsedState() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const savedSidebarState = window.localStorage.getItem(desktopSidebarStateStorageKey);

    return savedSidebarState !== "expanded";
  } catch {
    return true;
  }
}

export function AdminShell({
  activeItem,
  children,
}: {
  activeItem: NavigationLabel;
  children: ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getInitialDesktopSidebarCollapsedState);
  const sidebarGridClassName = isSidebarCollapsed
    ? "lg:grid-cols-[88px_minmax(0,1fr)]"
    : "lg:grid-cols-[220px_minmax(0,1fr)]";
  const handleToggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed((currentValue) => !currentValue);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        desktopSidebarStateStorageKey,
        isSidebarCollapsed ? "collapsed" : "expanded",
      );
    } catch {
      // Ignore storage failures; the sidebar still works for the current session.
    }
  }, [isSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-white text-[#171717]">
      <div className={`grid min-h-dvh grid-cols-[44px_minmax(0,1fr)] transition-[grid-template-columns] duration-200 ease-out min-[380px]:grid-cols-[48px_minmax(0,1fr)] sm:grid-cols-[56px_minmax(0,1fr)] motion-reduce:transition-none ${sidebarGridClassName}`}>
        <MobileSidebar activeItem={activeItem} />
        <Sidebar
          activeItem={activeItem}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={handleToggleSidebarCollapsed}
        />
        <main className="min-w-0 bg-white">
          <div className="h-full px-2.5 pt-3 pb-5 sm:px-6 sm:pt-8 lg:ml-6 lg:max-w-none lg:px-0 lg:pt-8 lg:pb-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

const MobileSidebar = memo(function MobileSidebar({
  activeItem,
}: {
  activeItem: NavigationLabel;
}) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { adminEmail, adminName, initials, profileImageUrl } = useMemo(
    () => ({
      adminEmail: user?.email_id?.trim() || "Admin console",
      adminName: getAdminDisplayName(user),
      initials: getAdminInitials(user),
      profileImageUrl: getAdminProfileImageUrl(user),
    }),
    [user],
  );
  const handleLogout = useCallback(() => {
    setShowProfileMenu(false);
    logout();
    router.replace("/login");
  }, [logout, router]);
  const handleProfileMenuToggle = useCallback(() => {
    setShowProfileMenu((currentValue) => !currentValue);
  }, []);

  useEffect(() => {
    if (!showProfileMenu) {
      return;
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showProfileMenu]);

  return (
    <aside
      aria-labelledby={mobileSidebarTitleId}
      className="sticky top-0 z-30 flex h-screen flex-col overflow-visible border-r border-[#00000014] bg-white lg:hidden"
      style={{ height: "100dvh", minHeight: "100svh" }}
    >
      <header className="flex h-14 shrink-0 items-center justify-center border-b border-[#00000014]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black text-white" aria-hidden="true">
          <ShieldCheck size={16} aria-hidden="true" />
        </span>
        <p id={mobileSidebarTitleId} className="sr-only">
          Admin Panel
        </p>
      </header>

      <nav className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-1 py-4" aria-label="Mobile primary navigation">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = item.label === activeItem;

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className={`mx-auto flex size-9 items-center justify-center rounded-xl text-[13px] font-medium leading-[19.5px] tracking-[-0.8px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 min-[380px]:size-10 ${
                    active
                      ? "bg-[#007AFF] text-white"
                      : "text-[#555555] hover:bg-black/[0.04] hover:text-[#171717]"
                  }`}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                >
                  <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                  <span className="sr-only">{item.label}</span>
                  {active ? <span className="sr-only">current page</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer
        className="relative mt-auto min-w-0 border-t border-black/[0.06] px-1 py-3"
        aria-labelledby="mobile-admin-account-title"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <p id="mobile-admin-account-title" className="sr-only">Signed-in admin account</p>
        {showProfileMenu ? (
          <div
            id={mobileProfileMenuId}
            role="menu"
            aria-label="Admin account actions"
            className="absolute bottom-3 left-[calc(100%+8px)] z-50 w-44 origin-bottom-left rounded-md border border-black/[0.08] bg-white p-1 shadow-[0_8px_30px_rgba(15,23,42,0.12)]"
          >
            <div className="border-b border-black/[0.06] px-3 py-2">
              <p className="truncate text-xs font-semibold leading-4.5 text-[#000000] capitalize">{adminName}</p>
              <p className="truncate text-[10px] font-normal leading-3.75 tracking-[0.12px] text-[#86868B]">{adminEmail}</p>
            </div>
            <button
              type="button"
              className="mt-1 flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-bold text-[#EF4444] transition hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2"
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
          className="mx-auto flex size-9 items-center justify-center rounded-xl border border-transparent transition hover:border-[#007AFF1F] hover:bg-[#F8FAFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 min-[380px]:size-10"
          aria-label={`${showProfileMenu ? "Close" : "Open"} admin account menu for ${adminName}`}
          aria-expanded={showProfileMenu}
          aria-controls={mobileProfileMenuId}
          aria-haspopup="menu"
          onClick={handleProfileMenuToggle}
        >
          <AdminAvatar initials={initials} profileImageUrl={profileImageUrl} />
        </button>
      </footer>
    </aside>
  );
});

const Sidebar = memo(function Sidebar({
  activeItem,
  isCollapsed,
  onToggleCollapsed,
}: {
  activeItem: NavigationLabel;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { adminEmail, adminName, initials, profileImageUrl } = useMemo(
    () => ({
      adminEmail: user?.email_id?.trim() || "Admin console",
      adminName: getAdminDisplayName(user),
      initials: getAdminInitials(user),
      profileImageUrl: getAdminProfileImageUrl(user),
    }),
    [user],
  );
  const handleLogout = useCallback(() => {
    setShowProfileMenu(false);
    logout();
    router.replace("/login");
  }, [logout, router]);
  const handleToggleCollapsed = useCallback(() => {
    setShowProfileMenu(false);
    onToggleCollapsed();
  }, [onToggleCollapsed]);
  const handleProfileMenuToggle = useCallback(() => {
    setShowProfileMenu((currentValue) => !currentValue);
  }, []);

  useEffect(() => {
    if (!showProfileMenu) {
      return;
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showProfileMenu]);

  return (
    <aside
      aria-labelledby={desktopSidebarTitleId}
      className="hidden overflow-visible border-r border-[#00000014] bg-white transition-[box-shadow] duration-300 ease-out lg:sticky lg:top-0 lg:z-30 lg:flex lg:h-screen lg:flex-col"
    >
      <header
        className={`relative flex h-14 shrink-0 items-center border-b border-[#00000014] ${
          isCollapsed ? "justify-start px-5" : "gap-2 px-5 pr-12"
        }`}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black text-white" aria-hidden="true">
          <ShieldCheck size={16} aria-hidden="true" />
        </span>
        <p
          id={desktopSidebarTitleId}
          className={
            isCollapsed
              ? "sr-only"
              : "text-sm tracking-[-0.5px] leading-5.25 font-bold text-[171717]"
          }
        >
          Admin Panel
        </p>
        <button
          type="button"
          aria-label={isCollapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
          aria-pressed={isCollapsed}
          onClick={handleToggleCollapsed}
          className={`absolute top-1/2 inline-flex -translate-y-1/2 transform-gpu items-center justify-center rounded-full border border-[#00000014] bg-white text-[#86868B] transition-[background-color,border-color,color,transform] duration-200 ease-out hover:scale-105 hover:border-[#007AFF33] hover:bg-[#F8FAFF] hover:text-[#007AFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 motion-reduce:transition-none ${
            isCollapsed ? "-right-3 size-6" : "-right-3.5 size-7"
          }`}
        >
          {isCollapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
        </button>
      </header>

      <NavigationList activeItem={activeItem} isCollapsed={isCollapsed} variant="desktop" />

      <footer
        className={`relative mt-auto border-t border-black/[0.08] py-4 ${
          isCollapsed ? "min-h-[86px] px-4" : "min-h-[93px] px-5"
        }`}
        aria-labelledby="desktop-admin-account-title"
      >
        <p id="desktop-admin-account-title" className="sr-only">Signed-in admin account</p>
        {showProfileMenu ? (
          <div
            id={desktopProfileMenuId}
            role="menu"
            aria-label="Admin account actions"
            className={`absolute z-50 origin-bottom transform-gpu rounded-md border border-black/[0.08] bg-white p-1 shadow-[0_8px_30px_rgba(15,23,42,0.12)] ${
              isCollapsed
                ? "bottom-4 left-[calc(100%+8px)] w-44"
                : "right-3 bottom-[96px] left-3"
            }`}
          >
            <button
              type="button"
              className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-bold text-[#EF4444] transition hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2"
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
          className={`flex w-full items-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 ${
            isCollapsed
              ? "justify-center rounded-xl border border-transparent p-1.5 hover:border-[#007AFF1F] hover:bg-[#F8FAFF]"
              : "gap-2.5 rounded-md text-left"
          }`}
          aria-label={`${showProfileMenu ? "Close" : "Open"} admin account menu for ${adminName}`}
          aria-expanded={showProfileMenu}
          aria-controls={desktopProfileMenuId}
          aria-haspopup="menu"
          onClick={handleProfileMenuToggle}
        >
          <AdminAvatar initials={initials} profileImageUrl={profileImageUrl} />
          {isCollapsed ? null : (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold leading-4.5 text-[#000000] capitalize">{adminName}</p>
                <p className="truncate text-[10px] font-normal leading-3.75 tracking-[0.12px] text-[#86868B]">{adminEmail}</p>
              </div>
              <ChevronDown
                size={14}
                className={`shrink-0 text-[#86868B] transition ${showProfileMenu ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </footer>
    </aside>
  );
});

const NavigationList = memo(function NavigationList({
  activeItem,
  isCollapsed = false,
  onNavigate,
  variant,
}: {
  activeItem: NavigationLabel;
  isCollapsed?: boolean;
  onNavigate?: () => void;
  variant: "desktop" | "mobile";
}) {
  const isMobile = variant === "mobile";
  const navClassName = isMobile
    ? "overflow-y-auto px-3 py-4"
    : isCollapsed
      ? "px-4 py-5"
      : "px-3 py-4";
  const linkClassName = (active: boolean) =>
    isMobile
      ? `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 ${
          active
            ? "bg-[#007AFF] text-white"
            : "text-[#555555] hover:bg-black/[0.04] hover:text-[#171717]"
        }`
      : `flex items-center text-[13px] font-medium leading-[19.5px] tracking-[-0.8px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 ${
          isCollapsed ? "mx-auto size-11 justify-center rounded-xl" : "h-9 gap-3 rounded-md px-3"
        } ${
          active
            ? "bg-[#007AFF] text-white"
            : "text-[#555555] hover:bg-black/[0.04] hover:text-[#171717]"
        }`;

  return (
    <nav className={navClassName} aria-label={isMobile ? "Mobile primary navigation" : "Primary navigation"}>
      <ul className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = item.label === activeItem;

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                prefetch={false}
                className={linkClassName(active)}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                title={!isMobile && isCollapsed ? item.label : undefined}
              >
                <Icon
                  size={isMobile || isCollapsed ? 17 : 15}
                  strokeWidth={isCollapsed ? 1.9 : 2}
                  aria-hidden="true"
                />
                <span className={!isMobile && isCollapsed ? "sr-only" : undefined}>{item.label}</span>
                {active ? <span className="sr-only">current page</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

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
  profileImageUrl,
}: {
  initials: string;
  profileImageUrl: string;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const shouldShowImage = Boolean(profileImageUrl) && failedImageUrl !== profileImageUrl;

  if (shouldShowImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
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
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-xs font-bold text-white" aria-hidden="true">
      {initials}
    </span>
  );
}

function getAdminProfileImageUrl(user: AdminUser | null) {
  return user?.profile_pic_url?.trim() || user?.profilePicUrl?.trim() || "";
}
