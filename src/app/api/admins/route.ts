import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { isMissingTableError, requirePermission } from "@/lib/adminPermissions";

const missingAdminsTableMessage =
  "Database migration required. Run the latest SUPABASE_SETUP.md migration so admin_profiles exists.";

export async function GET() {
  const { allowed } = await requirePermission("admins.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ data: [], setupRequired: true, error: missingAdminsTableMessage });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: data || [] });
}

export async function POST(req: NextRequest) {
  const { allowed } = await requirePermission("admins.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, full_name, role, is_active = true } = await req.json();

  if (!email?.trim() || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("admin_profiles")
    .insert({
      email: email.trim().toLowerCase(),
      full_name: full_name?.trim() || null,
      role,
      is_active,
    })
    .select()
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ error: missingAdminsTableMessage }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
