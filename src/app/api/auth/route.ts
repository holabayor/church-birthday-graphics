import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    const memberId = cookieStore.get("member_id")?.value;

    return NextResponse.json({
      user: user ? { email: user.email, role: "admin" } : null,
      memberId: memberId || null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, email, password, phone_number } = body;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Sign out
  if (action === "logout") {
    await supabase.auth.signOut();
    const response = NextResponse.json({ success: true });
    response.cookies.delete("member_id");
    return response;
  }

  // Member Login
  if (action === "member-login") {
    if (!phone_number) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    try {
      const adminSupabase = createAdminClient();
      const { data: member, error } = await adminSupabase
        .from("members")
        .select("id, first_name, last_name, is_active")
        .eq("phone_number", phone_number.trim())
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!member) {
        return NextResponse.json({ error: "No member found with this phone number" }, { status: 404 });
      }

      if (member.is_active === false) {
        return NextResponse.json({ error: "This member profile is inactive" }, { status: 403 });
      }

      const response = NextResponse.json({
        success: true,
        memberId: member.id,
        name: `${member.first_name} ${member.last_name}`,
      });

      response.cookies.set("member_id", member.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });

      return response;
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Failed to authenticate member" }, { status: 500 });
    }
  }

  // Sign in (Admin)
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ success: true, user: data.user?.email });
}
