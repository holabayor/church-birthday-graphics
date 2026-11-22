"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  Gift,
  Home,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Settings,
  User,
  Users,
  Vote,
  ChevronRight,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useWorkspace } from "@/components/workspace-provider";
import { PERMISSION } from "@/lib/adminRoles";
import { SESSION_KIND } from "@/lib/sessionKinds";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavEntry = {
  href: string;
  tabKey?: string;
  matchPrefixes?: string[];
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

function getPageTitle(pathname: string): { title: string; subtitle: string } {
  if (pathname === "/") return { title: "Dashboard", subtitle: "Church Overview" };
  if (pathname.startsWith("/members")) return { title: "Members", subtitle: "Congregation Directory" };
  if (pathname.startsWith("/attendance")) return { title: "Attendance", subtitle: "Service & Follow-Up" };
  if (pathname.startsWith("/units/")) return { title: "Department Roster", subtitle: "Ministry Unit" };
  if (pathname.startsWith("/units")) return { title: "Ministry Units", subtitle: "Departments & Workers" };
  if (pathname.startsWith("/outreach")) return { title: "Outreach", subtitle: "Follow-Up & Contacts" };
  if (pathname.startsWith("/designs")) return { title: "Birthdays & Cards", subtitle: "Celebrations & Studio" };
  if (pathname.startsWith("/polls-manage") || pathname.startsWith("/polls"))
    return { title: "Polls & Voting", subtitle: "Congregation Decisions" };
  if (pathname.startsWith("/profile")) return { title: "My Profile", subtitle: "Personal Record" };
  if (pathname.startsWith("/settings")) return { title: "Church Settings", subtitle: "Identity & Access" };
  return { title: "Kinship", subtitle: "Church Portal" };
}

export function MobileTopHeader() {
  const pathname = usePathname();
  const { churchIdentity, displayName, role, sessionKind } = useWorkspace();
  const { title, subtitle } = getPageTitle(pathname);
  const churchName = churchIdentity.church_name || "Kinship";

  const roleBadgeLabel =
    sessionKind === SESSION_KIND.SUPER_ADMIN
      ? "Super Admin"
      : role
      ? role.replace(/_/g, " ")
      : "Member";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--outline-variant)]/70 bg-white/95 px-4 backdrop-blur-md md:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8.5 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-xs font-bold text-white shadow-2xs">
          {churchIdentity.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={churchIdentity.logo_url} alt="" className="size-full object-contain p-0.5 bg-white" />
          ) : (
            churchName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-wider text-primary leading-none">
            {subtitle}
          </p>
          <h2 className="truncate font-[var(--font-manrope)] text-sm font-bold text-foreground leading-tight mt-0.5">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Badge
          variant="outline"
          className="hidden min-[360px]:inline-flex rounded-full border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-semibold capitalize text-primary"
        >
          {roleBadgeLabel}
        </Badge>
        <Link
          href="/profile"
          className="flex size-8.5 items-center justify-center rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-xs font-bold text-primary transition-colors hover:bg-[var(--surface-container)]"
          title={displayName}
        >
          {displayName.charAt(0).toUpperCase()}
        </Link>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [memberTab, setMemberTab] = useState("overview");
  const {
    can,
    hasMemberProfile,
    memberUnitLeadership,
    displayName,
    displayEmail,
    sessionKind,
    role,
    logout,
  } = useWorkspace();

  useEffect(() => {
    const syncTab = () => {
      if (typeof window === "undefined") return;
      const tab = new URLSearchParams(window.location.search).get("tab") || "overview";
      setMemberTab(tab);
    };
    syncTab();
    window.addEventListener("popstate", syncTab);
    window.addEventListener("member-tab-change", syncTab);
    return () => {
      window.removeEventListener("popstate", syncTab);
      window.removeEventListener("member-tab-change", syncTab);
    };
  }, [pathname]);

  const isMemberOnly = !can(PERMISSION.DASHBOARD_VIEW) && hasMemberProfile;

  const isActive = (item: NavEntry) => {
    if (item.tabKey && pathname.startsWith("/profile")) {
      return memberTab === item.tabKey;
    }
    if (item.href === "/") return pathname === "/";
    if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) return true;
    return pathname.startsWith(item.href.split("?")[0]);
  };

  const canManagePolls = can(PERMISSION.POLLS_MANAGE);

  const allLinks: NavEntry[] = isMemberOnly
    ? [
        {
          href: "/profile?tab=overview",
          tabKey: "overview",
          label: "Home",
          shortLabel: "Home",
          description: "Your member dashboard, attendance & birthdays",
          icon: Home,
        },
        {
          href: "/profile?tab=units",
          tabKey: "units",
          label: "My Units",
          shortLabel: "My Units",
          description: "Your ministry departments, leaders & teammates",
          icon: Building2,
        },
        ...(memberUnitLeadership.length > 0
          ? [
              {
                href: "/units",
                label: "Unit Roster",
                shortLabel: "Roster",
                description: "Manage your assigned department roster",
                icon: Users,
              },
            ]
          : []),
        {
          href: "/profile?tab=edit",
          tabKey: "edit",
          label: "My Profile",
          shortLabel: "Profile",
          description: "Update your personal, school or work details",
          icon: User,
        },
      ]
    : [
        ...(can(PERMISSION.DASHBOARD_VIEW)
          ? [
              {
                href: "/",
                label: "Dashboard",
                shortLabel: "Home",
                description: "Church overview, metrics & celebrations",
                icon: Home,
              },
            ]
          : []),
        ...(can(PERMISSION.MEMBERS_VIEW)
          ? [
              {
                href: "/members",
                label: "Members",
                shortLabel: "Members",
                description: "Congregation & church workers directory",
                icon: Users,
              },
            ]
          : []),
        ...(can(PERMISSION.UNITS_VIEW) || can(PERMISSION.UNITS_MANAGE) || memberUnitLeadership.length > 0
          ? [
              {
                href: "/units",
                label: "Ministry Units",
                shortLabel: "Units",
                description: "Departments, HODs & unit rosters",
                icon: Building2,
              },
            ]
          : []),
        ...(can(PERMISSION.ATTENDANCE_VIEW)
          ? [
              {
                href: "/attendance",
                label: "Attendance",
                shortLabel: "Attendance",
                description: "Service check-in & absentee follow-up",
                icon: CalendarCheck,
              },
            ]
          : []),
        ...(can(PERMISSION.BIRTHDAYS_MANAGE)
          ? [
              {
                href: "/designs",
                matchPrefixes: ["/designs"],
                label: "Birthdays & Cards",
                shortLabel: "Birthdays",
                description: "Celebrants, Custom Card Studio & templates",
                icon: Gift,
              },
            ]
          : []),
        ...(canManagePolls
          ? [
              {
                href: "/polls-manage",
                matchPrefixes: ["/polls-manage", "/polls"],
                label: "Polls & Voting",
                shortLabel: "Polls",
                description: "Manage church polls & cast votes",
                icon: Vote,
              },
            ]
          : []),
        ...(hasMemberProfile
          ? [
              {
                href: "/profile",
                label: "My Profile",
                shortLabel: "Profile",
                description: "Your member dashboard & personal record",
                icon: User,
              },
            ]
          : []),
        ...(can(PERMISSION.SETTINGS_MANAGE) || can(PERMISSION.ADMINS_MANAGE)
          ? [
              {
                href: "/settings",
                label: "Church Settings",
                shortLabel: "Settings",
                description: "Church identity, roles & access control",
                icon: Settings,
              },
            ]
          : []),
      ];

  const primaryTabs = allLinks.slice(0, 4);
  const secondaryLinks = allLinks.slice(4);
  const isSecondaryActive = secondaryLinks.some((item) => isActive(item));

  return (
    <>
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--outline-variant)]/80 bg-white/95 backdrop-blur-md pb-safe md:hidden shadow-[0_-4px_20px_rgba(11,28,48,0.06)]"
      >
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-1">
          {primaryTabs.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (item.tabKey && typeof window !== "undefined") {
                    setTimeout(() => window.dispatchEvent(new Event("member-tab-change")), 10);
                  }
                }}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-semibold transition-colors",
                  active ? "text-primary" : "text-[var(--outline)] hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active ? "bg-primary/12 text-primary" : "text-[var(--outline)]"
                  )}
                >
                  <Icon className="size-4.5" />
                </div>
                <span className="truncate max-w-[68px] leading-none">{item.shortLabel}</span>
              </Link>
            );
          })}

          {/* More Menu Trigger */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-semibold transition-colors",
              isSecondaryActive || moreOpen ? "text-primary" : "text-[var(--outline)] hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                isSecondaryActive || moreOpen ? "bg-primary/12 text-primary" : "text-[var(--outline)]"
              )}
            >
              <LayoutGrid className="size-4.5" />
            </div>
            <span className="leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* Full Portal Menu Bottom Sheet (No Close Icon) */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] rounded-t-3xl border-t border-[var(--outline-variant)] bg-[var(--surface)] p-0 flex flex-col overflow-hidden"
        >
          <SheetHeader className="border-b border-[var(--outline-variant)]/60 bg-white px-5 py-3.5 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-2xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate font-[var(--font-manrope)] text-base font-bold text-foreground">
                    {displayName}
                  </SheetTitle>
                  <SheetDescription className="truncate text-xs text-[var(--on-surface-variant)]">
                    {displayEmail || (sessionKind === SESSION_KIND.SUPER_ADMIN ? "Super Administrator" : "Church Member")}
                  </SheetDescription>
                </div>
              </div>
              <Badge className="rounded-full bg-primary/10 text-primary border-0 capitalize text-xs px-3 py-1 shrink-0">
                <ShieldCheck className="size-3.5 mr-1" />
                {sessionKind === SESSION_KIND.SUPER_ADMIN ? "Super Admin" : role ? role.replace(/_/g, " ") : "Member"}
              </Badge>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <p className="px-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--outline)]">
              Church Portal Menu
            </p>
            <div className="grid grid-cols-1 gap-2">
              {allLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setMoreOpen(false);
                      if (item.tabKey && typeof window !== "undefined") {
                        setTimeout(() => window.dispatchEvent(new Event("member-tab-change")), 10);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all",
                      active
                        ? "border-primary/40 bg-primary/5 shadow-2xs"
                        : "border-[var(--outline-variant)]/60 bg-white hover:bg-[var(--surface-container-low)]"
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          active ? "bg-primary text-white" : "bg-[var(--surface-container-low)] text-primary"
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-bold truncate", active ? "text-primary" : "text-foreground")}>
                          {item.label}
                        </p>
                        <p className="text-xs text-[var(--on-surface-variant)] truncate">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-[var(--outline)]" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[var(--outline-variant)]/60 bg-white p-4 pb-safe">
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                logout();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
