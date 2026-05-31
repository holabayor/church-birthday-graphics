"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Home, Palette, Settings, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "member" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setRole("admin");
          } else if (data.memberId) {
            setRole("member");
          }
        }
      } catch (e) {
        console.error("Failed to check auth session:", e);
      } finally {
        setLoading(false);
      }
    }
    
    checkSession();
  }, [pathname]);

  // Hide sidebar on login pages
  if (pathname === "/login" || pathname === "/admin/login") return null;

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push(role === "admin" ? "/admin/login" : "/login");
    router.refresh();
  };

  if (loading) {
    return (
      <aside className="hidden md:flex w-64 bg-white border-r border-zinc-200 flex-col shrink-0 animate-pulse">
        <div className="p-6 border-b border-zinc-200 h-[89px]"></div>
        <div className="flex-1 p-3 space-y-4">
          <div className="h-10 bg-zinc-100 rounded-lg"></div>
          <div className="h-10 bg-zinc-100 rounded-lg"></div>
        </div>
      </aside>
    );
  }

  const activeLinks = role === "member"
    ? [{ href: "/profile", label: "My Profile", icon: User }]
    : [
        { href: "/", label: "Dashboard", icon: Home },
        { href: "/members", label: "Members", icon: Users },
        { href: "/designs", label: "Designs", icon: Palette },
        { href: "/settings", label: "Settings", icon: Settings },
      ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-zinc-200 flex-col shrink-0">
        <div className="p-6 border-b border-zinc-200">
          <h1 className="text-lg font-bold text-zinc-900">Birthday Graphics</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {role === "member" ? "Congregation Portal" : "Church Media Tool"}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {activeLinks.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-zinc-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 grid auto-cols-fr grid-flow-col gap-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50">
        {activeLinks.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
                className={`min-w-0 flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            );
          })}
        <button
          onClick={handleLogout}
          className="min-w-0 flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <LogOut size={20} className="shrink-0" />
          <span className="max-w-full truncate">Logout</span>
        </button>
      </nav>
    </>
  );
}
