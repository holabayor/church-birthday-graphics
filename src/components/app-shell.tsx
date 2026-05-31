"use client";

import { Sidebar } from "@/components/sidebar";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login" || pathname === "/admin/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto bg-zinc-50 pb-24 md:pb-0">{children}</main>
    </div>
  );
}
