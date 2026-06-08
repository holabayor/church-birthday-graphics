import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const rolePermissions: Record<string, string[]> = {
  super_admin: ["dashboard.view", "members.view", "members.manage", "attendance.view", "attendance.manage", "followups.manage", "birthdays.manage", "outreach.view", "settings.manage", "admins.manage", "units.view", "units.manage"],
  pastor: ["dashboard.view", "members.view", "attendance.view", "attendance.manage", "followups.manage", "birthdays.manage", "outreach.view", "units.view", "units.manage"],
  assistant_pastor: ["dashboard.view", "members.view", "attendance.view", "attendance.manage", "followups.manage", "outreach.view", "units.view", "units.manage"],
  secretary: ["dashboard.view", "members.view", "members.manage", "attendance.view", "attendance.manage", "units.view", "units.manage"],
  media: ["dashboard.view", "members.view", "birthdays.manage", "outreach.view"],
  follow_up: ["dashboard.view", "members.view", "attendance.view", "followups.manage", "outreach.view"],
  unit_leader: ["dashboard.view", "members.view", "attendance.view", "outreach.view", "units.view"],
};

const isMissingPermissionTableError = (error: { code?: string; message?: string } | null | undefined) =>
  error?.code === "PGRST205" ||
  error?.code === "42P01" ||
  Boolean(error?.message?.toLowerCase().includes("could not find the table"));

async function resolveRolePermissions(supabase: any, role: string | null | undefined) {
  if (!role) return [];
  if (role === "super_admin") return rolePermissions.super_admin;

  const fallback = rolePermissions[role] || [];
  const { data, error } = await supabase
    .from("app_role_permissions")
    .select("permission")
    .eq("role_key", role);

  if (error) {
    return isMissingPermissionTableError(error) ? fallback : fallback;
  }

  return data?.length ? data.map((row: any) => row.permission).filter(Boolean) : fallback;
}

const pagePermissions = [
  { path: "/members", permission: "members.view" },
  { path: "/attendance", permission: "attendance.view" },
  { path: "/units", permission: "units.view", any: ["units.view", "units.manage"] },
  { path: "/outreach", permission: "outreach.view" },
  { path: "/designs", permission: "birthdays.manage" },
  { path: "/settings", permission: "settings.manage", any: ["settings.manage", "admins.manage"] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: static assets, auth entry pages, public API endpoints
  const publicPages = ["/login", "/register", "/admin", "/admin/login"];
  const publicApiPaths = ["/api/auth", "/api/birthdays/send", "/api/generate"];
  if (
    publicPages.includes(pathname) ||
    publicApiPaths.some(p => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: do not add any logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser();

  const memberId = request.cookies.get("member_id")?.value;

  if (!user && !memberId) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const pageRule = pathname === "/"
      ? { path: "/", permission: "dashboard.view" }
      : pagePermissions.find(rule => pathname === rule.path || pathname.startsWith(`${rule.path}/`));

    if (pageRule) {
      const { data: profile, error } = await supabase
        .from("admin_profiles")
        .select("role, is_active")
        .eq("email", user.email)
        .maybeSingle();

      let permissions = rolePermissions.super_admin;

      if (!error && profile) {
        if (profile.is_active === false) {
          const loginUrl = new URL("/login", request.url);
          return NextResponse.redirect(loginUrl);
        }
        permissions = await resolveRolePermissions(supabase, profile.role);
      }

      const anyPermissions = "any" in pageRule ? pageRule.any : undefined;
      const allowed = anyPermissions
        ? anyPermissions.some(permission => permissions.includes(permission))
        : permissions.includes(pageRule.permission);

      if (!allowed) {
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
      }
    }
  }

  // Member user security constraints
  if (!user && memberId) {
    const { data: memberProfile } = await supabase
      .from("members")
      .select("email")
      .eq("id", memberId)
      .maybeSingle();

    let permissions: string[] = [];
    if (memberProfile?.email) {
      const { data: adminProfile } = await supabase
        .from("admin_profiles")
        .select("role, is_active")
        .eq("email", memberProfile.email)
        .maybeSingle();

      if (adminProfile?.is_active !== false && adminProfile?.role) {
        permissions = await resolveRolePermissions(supabase, adminProfile.role);
      }
    }

    const { data: unitLeadership } = await supabase
      .from("church_unit_members")
      .select("unit_id")
      .eq("member_id", memberId)
      .in("role", ["head", "assistant"]);

    const hasUnitLeadership = Boolean(unitLeadership && unitLeadership.length > 0);
    const pageRule = pathname === "/"
      ? { path: "/", permission: "dashboard.view" }
      : pagePermissions.find(rule => pathname === rule.path || pathname.startsWith(`${rule.path}/`));

    const anyPermissions = pageRule && "any" in pageRule ? pageRule.any : undefined;
    const pageAllowedByPermission = pageRule
      ? anyPermissions
        ? anyPermissions.some(permission => permissions.includes(permission))
        : permissions.includes(pageRule.permission)
      : false;

    const allowedMemberPages = [
      "/profile",
      ...(pageAllowedByPermission ? [pathname] : []),
      ...(hasUnitLeadership ? ["/units"] : []),
    ];
    const allowedMemberApis = [
      `/api/members/${memberId}`, 
      "/api/auth", 
      "/api/upload",
      "/api/units",
      "/api/birthday-messages",
      ...(permissions.includes("members.view") || permissions.includes("members.manage") ? ["/api/members"] : []),
      ...(permissions.includes("attendance.view") || permissions.includes("attendance.manage") ? ["/api/attendance"] : []),
      ...(permissions.includes("outreach.view") ? ["/api/outreach"] : []),
      ...(permissions.includes("settings.manage") ? ["/api/church-settings"] : []),
    ];

    const isAllowedPage = allowedMemberPages.some(p => pathname === p || (p === "/units" && pathname.startsWith("/units/")));
    const isAllowedApi = allowedMemberApis.some(p => pathname === p || pathname.startsWith(p));
    const isApiRoute = pathname.startsWith("/api");

    if (isApiRoute) {
      if (!isAllowedApi) {
        return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      if (!isAllowedPage) {
        const profileUrl = new URL("/profile", request.url);
        return NextResponse.redirect(profileUrl);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all request paths except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
