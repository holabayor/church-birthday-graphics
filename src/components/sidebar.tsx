"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  Home,
  LogOut,
  MessageCircle,
  Palette,
  Settings,
  User,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

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
import { PERMISSION, type Permission } from "@/lib/adminRoles";
import { AUTH_ACTION } from "@/lib/authActions";
import { SESSION_KIND, type SessionKind } from "@/lib/sessionKinds";

type NavSection = "personal" | "operations" | "system";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section: NavSection;
};

const navSections: Array<{ key: NavSection; label: string }> = [
  { key: "personal", label: "Personal" },
  { key: "operations", label: "Operations" },
  { key: "system", label: "System" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionKind, setSessionKind] = useState<SessionKind | null>(null);
  const [hasMemberProfile, setHasMemberProfile] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [memberUnitLeadership, setMemberUnitLeadership] = useState<Array<{ id: string; name: string; role: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setSessionKind(SESSION_KIND.SUPER_ADMIN);
            setHasMemberProfile(Boolean(data.memberId));
          } else if (data.memberId || data.member) {
            setSessionKind(SESSION_KIND.MEMBER);
            setHasMemberProfile(true);
          }
          setPermissions(data.permissions || data.user?.permissions || data.member?.permissions || []);
          setMemberUnitLeadership(data.memberUnitLeadership || []);
        }
      } catch (e) {
        console.error("Failed to check auth session:", e);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: AUTH_ACTION.LOGOUT }),
    });
    router.push(sessionKind === SESSION_KIND.SUPER_ADMIN ? "/admin" : "/login");
    router.refresh();
  };

  const can = (permission: Permission) => permissions.includes(permission);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const workspaceLabel =
    permissions.length > 0 || memberUnitLeadership.length > 0 ? "Ministry workspace" : "Member workspace";
  const hasAdminCapability = permissions.length > 0;

  const activeLinks: NavItem[] = [
    ...(hasMemberProfile ? [{ href: "/profile", label: "My Profile", icon: User, section: "personal" as const }] : []),
    ...(can(PERMISSION.DASHBOARD_VIEW)
      ? [{ href: "/", label: "Dashboard", icon: Home, section: "operations" as const }]
      : []),
    ...(can(PERMISSION.MEMBERS_VIEW)
      ? [{ href: "/members", label: "Members", icon: Users, section: "operations" as const }]
      : []),
    ...(can(PERMISSION.ATTENDANCE_VIEW)
      ? [{ href: "/attendance", label: "Attendance", icon: CalendarCheck, section: "operations" as const }]
      : []),
    ...(can(PERMISSION.UNITS_VIEW) || can(PERMISSION.UNITS_MANAGE) || memberUnitLeadership.length > 0
      ? [
          {
            href: "/units",
            label:
              hasMemberProfile && !can(PERMISSION.UNITS_VIEW) && !can(PERMISSION.UNITS_MANAGE) ? "My Units" : "Units",
            icon: Building2,
            section: "operations" as const,
          },
        ]
      : []),
    ...(can(PERMISSION.OUTREACH_VIEW)
      ? [{ href: "/outreach", label: "Outreach", icon: MessageCircle, section: "operations" as const }]
      : []),
    ...(can(PERMISSION.BIRTHDAYS_MANAGE)
      ? [{ href: "/designs", label: "Birthdays", icon: Palette, section: "operations" as const }]
      : []),
    ...(can(PERMISSION.POLLS_MANAGE)
      ? [{ href: "/polls-manage", label: "Polls", icon: Vote, section: "operations" as const }]
      : []),
    ...(can(PERMISSION.SETTINGS_MANAGE) || can(PERMISSION.ADMINS_MANAGE)
      ? [{ href: "/settings", label: "Settings", icon: Settings, section: "system" as const }]
      : []),
  ];

  return (
    <ShadcnSidebar collapsible="icon" className="border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-14 gap-3 rounded-lg px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent"
              tooltip="Kinship Management"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-base font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)]">
                K
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="font-mono text-[12px] font-medium uppercase leading-4 tracking-[0.05em] text-sidebar-foreground/60">
                  Kinship
                </span>
                <span className="truncate font-[var(--font-manrope)] text-[20px] font-semibold leading-7 text-sidebar-foreground">
                  Management
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2 group-data-[collapsible=icon]:hidden">
          <p className="font-mono text-[12px] font-medium uppercase leading-4 tracking-[0.05em] text-[var(--primary)]">
            {sessionKind === SESSION_KIND.SUPER_ADMIN ? "Super admin" : workspaceLabel}
          </p>
          <p className="mt-1 text-sm leading-5 text-sidebar-foreground/80">
            {sessionKind === SESSION_KIND.SUPER_ADMIN
              ? "Restricted console"
              : hasAdminCapability
                ? "Member access with assigned permissions"
                : "Your congregation space"}
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-1 py-3">
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
          navSections.map(section => {
            const links = activeLinks.filter(link => link.section === section.key);
            if (links.length === 0) return null;

            return (
              <SidebarGroup key={section.key} className="py-1">
                <SidebarGroupLabel className="font-mono text-[12px] font-medium uppercase tracking-[0.05em] text-sidebar-foreground/50">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {links.map(({ href, label, icon: Icon }) => {
                      const active = isActive(href);

                      return (
                        <SidebarMenuItem key={href} className="relative">
                          {active && (
                            <div className="absolute left-[-4px] top-[12px] bottom-[12px] w-1 rounded-r bg-[var(--primary)]" />
                          )}
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={label}
                            className="min-h-10 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground [&>svg]:text-sidebar-foreground data-[active=true]:[&>svg]:text-[var(--primary)]"
                          >
                            <Link href={href} aria-current={active ? "page" : undefined}>
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
              onClick={handleLogout}
              tooltip="Logout"
              className="min-h-10 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>svg]:text-sidebar-foreground"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  );
}
