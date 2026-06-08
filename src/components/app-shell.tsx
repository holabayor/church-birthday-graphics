"use client";

import { Sidebar } from "@/components/sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/admin" || pathname === "/admin/login";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17.5rem",
          "--sidebar-width-icon": "3.25rem",
        } as CSSProperties
      }
    >
      <Sidebar />
      <SidebarInset className="min-w-0 bg-[var(--surface)]">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-[var(--outline-variant)] bg-white/90 px-4 backdrop-blur md:hidden">
          <SidebarTrigger className="size-9 rounded-lg text-primary hover:bg-[var(--surface-container)]" />
        </header>
        <main className="min-w-0 flex-1 pb-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
