"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  Gift,
  Home,
  LogOut,
  MessageCircle,
  Settings,
  User,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { PERMISSION } from "@/lib/adminRoles";
import { SESSION_KIND } from "@/lib/sessionKinds";
import { useWorkspace } from "@/components/workspace-provider";

type NavSection = "ministry" | "account";

type NavItem = {
  href: string;
  matchPrefixes?: string[];
  label: string;
  icon: LucideIcon;
  section: NavSection;
};

const navSections: Array<{ key: NavSection; label: string }> = [
  { key: "ministry", label: "Church Ministry" },
  { key: "account", label: "Account & System" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [memberTab, setMemberTab] = useState("overview");
  const {
    loading,
    sessionKind,
    hasMemberProfile,
    permissions,
    memberUnitLeadership,
    churchIdentity,
    displayName,
    role,
    can,
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

  const isActive = (item: NavItem & { tabKey?: string }) => {
    if (item.tabKey && pathname.startsWith("/profile")) {
      return memberTab === item.tabKey;
    }
    if (item.href === "/") return pathname === "/";
    if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) return true;
    return pathname.startsWith(item.href.split("?")[0]);
  };

  const portalLabel =
    permissions.length > 0 || memberUnitLeadership.length > 0 ? "Ministry Portal" : "Member Portal";
  const hasAdminCapability = permissions.length > 0;
  const churchName = churchIdentity.church_name || "Kinship";

  const canManagePolls = can(PERMISSION.POLLS_MANAGE);

  const activeLinks: Array<NavItem & { tabKey?: string }> = isMemberOnly
    ? [
        {
          href: "/profile?tab=overview",
          tabKey: "overview",
          label: "Home",
          icon: Home,
          section: "ministry" as const,
        },
        {
          href: "/profile?tab=units",
          tabKey: "units",
          label: "My Units",
          icon: Building2,
          section: "ministry" as const,
        },
        ...(memberUnitLeadership.length > 0
          ? [
              {
                href: "/units",
                label: "Unit Leadership",
                icon: Users,
                section: "ministry" as const,
              },
            ]
          : []),
        {
          href: "/profile?tab=edit",
          tabKey: "edit",
          label: "My Profile",
          icon: User,
          section: "account" as const,
        },
      ]
    : [
        ...(can(PERMISSION.DASHBOARD_VIEW)
          ? [{ href: "/", label: "Dashboard", icon: Home, section: "ministry" as const }]
          : []),
        ...(can(PERMISSION.MEMBERS_VIEW)
          ? [{ href: "/members", label: "Members", icon: Users, section: "ministry" as const }]
          : []),
        ...(can(PERMISSION.UNITS_VIEW) || can(PERMISSION.UNITS_MANAGE) || memberUnitLeadership.length > 0
          ? [
              {
                href: "/units",
                label: "Ministry Units",
                icon: Building2,
                section: "ministry" as const,
              },
            ]
          : []),
        ...(can(PERMISSION.ATTENDANCE_VIEW)
          ? [{ href: "/attendance", label: "Attendance", icon: CalendarCheck, section: "ministry" as const }]
          : []),
        ...(can(PERMISSION.BIRTHDAYS_MANAGE)
          ? [
              {
                href: "/designs",
                matchPrefixes: ["/designs"],
                label: "Birthdays & Cards",
                icon: Gift,
                section: "ministry" as const,
              },
            ]
          : []),
        ...(canManagePolls
          ? [
              {
                href: "/polls-manage",
                matchPrefixes: ["/polls-manage", "/polls"],
                label: "Polls & Voting",
                icon: Vote,
                section: "ministry" as const,
              },
            ]
          : []),
        ...(hasMemberProfile
          ? [{ href: "/profile", label: "My Profile", icon: User, section: "account" as const }]
          : []),
        ...(can(PERMISSION.SETTINGS_MANAGE) || can(PERMISSION.ADMINS_MANAGE)
          ? [{ href: "/settings", label: "Church Settings", icon: Settings, section: "account" as const }]
          : []),
      ];

  return (
    <ShadcnSidebar collapsible="icon" className="hidden md:flex border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-14 gap-3 rounded-xl px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent"
              tooltip={churchName}
            >
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--primary)] text-base font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.2)]">
                {churchIdentity.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={churchIdentity.logo_url} alt="" className="size-full object-contain p-1 bg-white" />
                ) : (
                  churchName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="font-mono text-[10px] font-semibold uppercase leading-4 tracking-[0.06em] text-primary">
                  Church Portal
                </span>
                <span className="truncate font-[var(--font-manrope)] text-base font-bold leading-5 text-sidebar-foreground">
                  {churchName}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/70 px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[11px] font-semibold uppercase leading-4 tracking-[0.05em] text-[var(--primary)] truncate">
              {sessionKind === SESSION_KIND.SUPER_ADMIN ? "Super Admin" : portalLabel}
            </p>
            {role && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold capitalize text-primary">
                {role.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs font-medium text-sidebar-foreground/80">
            {displayName}
          </p>
          <p className="text-[11px] leading-4 text-sidebar-foreground/60">
            {sessionKind === SESSION_KIND.SUPER_ADMIN
              ? "Full administrative console"
              : hasAdminCapability
                ? "Assigned ministry permissions"
                : "Congregation member portal"}
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-1.5 py-3">
        {loading ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          navSections.map((section) => {
            const links = activeLinks.filter((link) => link.section === section.key);
            if (links.length === 0) return null;

            return (
              <SidebarGroup key={section.key} className="py-1">
                <SidebarGroupLabel className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-sidebar-foreground/45">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {links.map((item) => {
                      const { href, label, icon: Icon } = item;
                      const active = isActive(item);

                      return (
                        <SidebarMenuItem key={href} className="relative">
                          {active && (
                            <div className="absolute left-[-6px] top-[10px] bottom-[10px] w-1 rounded-r bg-[var(--primary)]" />
                          )}
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={label}
                            className="min-h-10 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground [&>svg]:text-sidebar-foreground/70 data-[active=true]:[&>svg]:text-[var(--primary)]"
                          >
                            <Link
                              href={href}
                              aria-current={active ? "page" : undefined}
                              onClick={() => {
                                if (item.tabKey && typeof window !== "undefined") {
                                  setTimeout(() => window.dispatchEvent(new Event("member-tab-change")), 10);
                                }
                              }}
                            >
                              <Icon />
                              <span>{label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Sign Out"
              className="min-h-10 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive [&>svg]:text-destructive"
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  );
}
