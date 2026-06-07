import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { isMissingTableError, requirePermission } from "@/lib/adminPermissions";

const missingAdminsTableMessage =
  "Database migration required. Run the latest SUPABASE_SETUP.md migration so admin_profiles exists.";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission("admins.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { email, full_name, role, is_active } = await req.json();

  if (!email?.trim() || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("admin_profiles")
    .update({
      email: email.trim().toLowerCase(),
      full_name: full_name?.trim() || null,
      role,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ error: missingAdminsTableMessage }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission("admins.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("admin_profiles").delete().eq("id", id);

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ error: missingAdminsTableMessage }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
