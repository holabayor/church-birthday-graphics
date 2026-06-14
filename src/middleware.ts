import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLE, PERMISSION, pageAccessDefinitions, rolePermissions } from "@/lib/adminRoles";
import { UNIT_ROLE } from "@/lib/unitRoles";

const isMissingPermissionTableError = (error: { code?: string; message?: string } | null | undefined) =>
  error?.code === "PGRST205" ||
  error?.code === "42P01" ||
  Boolean(error?.message?.toLowerCase().includes("could not find the table"));

async function resolveRolePermissions(supabase: any, role: string | null | undefined) {
  if (!role) return [];
  if (role === ADMIN_ROLE.SUPER_ADMIN) return rolePermissions[ADMIN_ROLE.SUPER_ADMIN];

  const fallback = rolePermissions[role as keyof typeof rolePermissions] || [];
  const { data, error } = await supabase
    .from("app_role_permissions")
    .select("permission")
    .eq("role_key", role);

  if (error) {
    return isMissingPermissionTableError(error) ? fallback : fallback;
  }

  return data?.length ? data.map((row: any) => row.permission).filter(Boolean) : fallback;
}

const pagePermissions = pageAccessDefinitions
  .filter(page => page.path !== "/")
  .map(page => ({
    path: page.path,
    permission: page.enablePermission,
    any: page.visibilityPermissions,
  }));

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: static assets, auth entry pages, public API endpoints
  const publicPages = ["/login", "/register", "/admin", "/admin/login"];
  const publicApiPaths = ["/api/auth", "/api/church-settings", "/api/birthdays/send", "/api/generate"];
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
      ? { path: "/", permission: PERMISSION.DASHBOARD_VIEW, any: [PERMISSION.DASHBOARD_VIEW] }
      : pagePermissions.find(rule => pathname === rule.path || pathname.startsWith(`${rule.path}/`));

    if (pageRule) {
      const { data: profile, error } = await supabase
        .from("admin_profiles")
        .select("role, is_active")
        .eq("email", user.email)
        .maybeSingle();

      let permissions = rolePermissions[ADMIN_ROLE.SUPER_ADMIN];

      if (!error && profile) {
        if (profile.is_active === false) {
          const loginUrl = new URL("/login", request.url);
          return NextResponse.redirect(loginUrl);
        }
        permissions = await resolveRolePermissions(supabase, profile.role);
      }

      const allowed = pageRule.any.some(permission => permissions.includes(permission));

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
      .in("role", [UNIT_ROLE.HEAD, UNIT_ROLE.ASSISTANT]);

    const hasUnitLeadership = Boolean(unitLeadership && unitLeadership.length > 0);
    const pageRule = pathname === "/"
      ? { path: "/", permission: PERMISSION.DASHBOARD_VIEW, any: [PERMISSION.DASHBOARD_VIEW] }
      : pagePermissions.find(rule => pathname === rule.path || pathname.startsWith(`${rule.path}/`));

    const pageAllowedByPermission = pageRule
      ? pageRule.any.some(permission => permissions.includes(permission))
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
      ...(permissions.includes(PERMISSION.MEMBERS_VIEW) || permissions.includes(PERMISSION.MEMBERS_MANAGE) ? ["/api/members"] : []),
      ...(permissions.includes(PERMISSION.ATTENDANCE_VIEW) || permissions.includes(PERMISSION.ATTENDANCE_MANAGE) ? ["/api/attendance"] : []),
      ...(permissions.includes(PERMISSION.OUTREACH_VIEW) ? ["/api/outreach"] : []),
      ...(permissions.includes(PERMISSION.SETTINGS_MANAGE) ? ["/api/church-settings"] : []),
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
