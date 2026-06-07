import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const rolePermissions: Record<string, string[]> = {
  super_admin: ["dashboard.view", "members.view", "attendance.view", "birthdays.manage", "outreach.view", "settings.manage", "admins.manage", "units.view", "units.manage"],
  pastor: ["dashboard.view", "members.view", "attendance.view", "birthdays.manage", "outreach.view", "units.view", "units.manage"],
  assistant_pastor: ["dashboard.view", "members.view", "attendance.view", "outreach.view", "units.view", "units.manage"],
  secretary: ["dashboard.view", "members.view", "attendance.view", "units.view", "units.manage"],
  media: ["dashboard.view", "members.view", "birthdays.manage", "outreach.view"],
  follow_up: ["dashboard.view", "members.view", "attendance.view", "outreach.view"],
  unit_leader: ["dashboard.view", "members.view", "attendance.view", "outreach.view", "units.view"],
};

const pagePermissions = [
  { path: "/members", permission: "members.view" },
  { path: "/attendance", permission: "attendance.view" },
  { path: "/units", permission: "units.view", any: ["units.view", "units.manage"] },
  { path: "/outreach", permission: "outreach.view" },
  { path: "/designs", permission: "birthdays.manage" },
  { path: "/settings", permission: "settings.manage", any: ["settings.manage", "admins.manage", "units.manage"] },
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
        permissions = rolePermissions[profile.role] || rolePermissions.secretary;
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
    const allowedMemberPages = ["/profile", "/units"];
    const allowedMemberApis = [
      `/api/members/${memberId}`, 
      "/api/auth", 
      "/api/upload",
      "/api/units",
      "/api/birthday-messages"
    ];

    const isAllowedPage = allowedMemberPages.some(p => pathname === p);
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
