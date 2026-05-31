import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: static assets, login page, public API endpoints
  const publicPaths = ["/login", "/admin/login", "/api/auth", "/api/birthdays/send", "/api/generate"];
  if (
    publicPaths.some(p => pathname.startsWith(p)) ||
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
    const loginUrl = new URL(pathname === "/profile" ? "/login" : "/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Member user security constraints
  if (!user && memberId) {
    const allowedMemberPages = ["/profile"];
    const allowedMemberApis = [
      `/api/members/${memberId}`, 
      "/api/auth", 
      "/api/upload"
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
