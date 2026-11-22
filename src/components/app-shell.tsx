"use client";

import { Sidebar } from "@/components/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceProvider, useWorkspace } from "@/components/workspace-provider";
import { MobileTopHeader, MobileBottomNav } from "@/components/mobile-nav";
import { usePathname } from "next/navigation";
import { CSSProperties, ReactNode } from "react";

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useWorkspace();

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/admin" ||
    pathname === "/admin/login";
  const isTvPage = pathname.endsWith("/tv");
  const isPublicPollRoute = pathname.startsWith("/polls") && !pathname.startsWith("/polls-manage");

  if (isAuthPage || isTvPage) {
    return <>{children}</>;
  }

  if (isPublicPollRoute) {
    if (loading || !isAuthenticated) {
      return <>{children}</>;
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17.5rem",
          "--sidebar-width-icon": "3.5rem",
        } as CSSProperties
      }
    >
      <Sidebar />
      <SidebarInset className="min-w-0 bg-[var(--surface)]">
        <MobileTopHeader />
        <main className="min-w-0 flex-1 pb-24 md:pb-10">{children}</main>
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <AppShellInner>{children}</AppShellInner>
    </WorkspaceProvider>
  );
}
