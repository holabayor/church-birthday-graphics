"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PERMISSION, type AdminRole, type Permission } from "@/lib/adminRoles";
import { AUTH_ACTION } from "@/lib/authActions";
import { SESSION_KIND, type SessionKind } from "@/lib/sessionKinds";

export type ChurchIdentity = {
  church_name: string;
  church_address?: string;
  logo_url: string | null;
};

export type UnitLeadershipItem = {
  id: string;
  name: string;
  role: string;
};

export type WorkspaceContextValue = {
  loading: boolean;
  isAuthenticated: boolean;
  sessionKind: SessionKind | null;
  hasMemberProfile: boolean;
  memberId: string | null;
  displayName: string;
  displayEmail: string | null;
  role: AdminRole | null;
  permissions: Permission[];
  memberUnitLeadership: UnitLeadershipItem[];
  hasActivePolls: boolean;
  churchIdentity: ChurchIdentity;
  can: (permission: Permission) => boolean;
  refreshWorkspace: () => Promise<void>;
  logout: () => Promise<void>;
};

const defaultIdentity: ChurchIdentity = {
  church_name: "Kinship Church",
  church_address: "",
  logo_url: null,
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  loading: true,
  isAuthenticated: false,
  sessionKind: null,
  hasMemberProfile: false,
  memberId: null,
  displayName: "Member",
  displayEmail: null,
  role: null,
  permissions: [],
  memberUnitLeadership: [],
  hasActivePolls: false,
  churchIdentity: defaultIdentity,
  can: () => false,
  refreshWorkspace: async () => {},
  logout: async () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionKind, setSessionKind] = useState<SessionKind | null>(null);
  const [hasMemberProfile, setHasMemberProfile] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Member");
  const [displayEmail, setDisplayEmail] = useState<string | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [memberUnitLeadership, setMemberUnitLeadership] = useState<UnitLeadershipItem[]>([]);
  const [hasActivePolls, setHasActivePolls] = useState(false);
  const [churchIdentity, setChurchIdentity] = useState<ChurchIdentity>(defaultIdentity);

  const checkSession = useCallback(async () => {
    try {
      const [authRes, settingsRes] = await Promise.all([
        fetch("/api/auth").catch(() => null),
        fetch("/api/church-settings").catch(() => null),
      ]);

      if (settingsRes?.ok) {
        const settingsData = await settingsRes.json().catch(() => null);
        if (settingsData && !settingsData.error) {
          setChurchIdentity({
            church_name: settingsData.church_name || "Kinship Church",
            church_address: settingsData.church_address || "",
            logo_url: settingsData.logo_url || null,
          });
        }
      }

      if (authRes?.ok) {
        const data = await authRes.json();
        const isLoggedIn = Boolean(data.user || data.memberId || data.member);
        setIsAuthenticated(isLoggedIn);

        if (data.user) {
          setSessionKind(SESSION_KIND.SUPER_ADMIN);
          setHasMemberProfile(Boolean(data.memberId));
        } else if (data.memberId || data.member) {
          setSessionKind(SESSION_KIND.MEMBER);
          setHasMemberProfile(true);
        } else {
          setSessionKind(null);
          setHasMemberProfile(false);
        }

        setMemberId(data.memberId || data.member?.id || null);
        setDisplayName(
          data.member?.name || data.user?.name || data.user?.email?.split("@")[0] || "Church Member"
        );
        setDisplayEmail(data.user?.email || data.member?.email || null);
        setRole((data.user?.role || data.member?.role || null) as AdminRole | null);
        setPermissions(data.permissions || data.user?.permissions || data.member?.permissions || []);
        setMemberUnitLeadership(data.memberUnitLeadership || []);

        if (isLoggedIn) {
          let fp = "";
          if (typeof window !== "undefined") {
            fp = localStorage.getItem("poll_device_fingerprint") || "";
          }
          const fpParam = fp ? `?fingerprint=${fp}` : "";
          fetch(`/api/polls${fpParam}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((pollsData) => {
              if (pollsData) {
                const now = new Date();
                const activeEligible = (pollsData.data || []).some(
                  (p: any) =>
                    p.status === "active" &&
                    p.is_eligible !== false &&
                    (!p.ends_at || new Date(p.ends_at) >= now)
                );
                setHasActivePolls(activeEligible);
              }
            })
            .catch(() => {});
        } else {
          setHasActivePolls(false);
        }
      } else {
        setIsAuthenticated(false);
        setSessionKind(null);
        setHasMemberProfile(false);
        setPermissions([]);
        setHasActivePolls(false);
      }
    } catch (e) {
      console.error("Workspace session check failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [pathname, checkSession]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("auth-change", checkSession);
      return () => window.removeEventListener("auth-change", checkSession);
    }
  }, [checkSession]);

  const can = useCallback(
    (permission: Permission) => permissions.includes(permission),
    [permissions]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: AUTH_ACTION.LOGOUT }),
    });
    const target = sessionKind === SESSION_KIND.SUPER_ADMIN ? "/admin" : "/login";
    setIsAuthenticated(false);
    router.push(target);
    router.refresh();
  }, [router, sessionKind]);

  return (
    <WorkspaceContext.Provider
      value={{
        loading,
        isAuthenticated,
        sessionKind,
        hasMemberProfile,
        memberId,
        displayName,
        displayEmail,
        role,
        permissions,
        memberUnitLeadership,
        hasActivePolls,
        churchIdentity,
        can,
        refreshWorkspace: checkSession,
        logout,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
