import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { attachMemberProfiles, saveMemberProfiles } from "@/lib/memberProfiles";
import { attachMemberUnits, saveMemberUnits } from "@/lib/memberUnits";
import { requirePermission } from "@/lib/adminPermissions";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const memberId = cookieStore.get("member_id")?.value;
  if (memberId !== id) {
    const { allowed } = await requirePermission("members.view");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST204" || error.code === "PGRST205" || error.code === "42P01") {
      return NextResponse.json({
        error: "Database migration required. Run the latest SUPABASE_SETUP.md migration so members.member_type and profile/unit tables exist.",
      }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const [memberWithProfiles] = await attachMemberProfiles(supabase, [data]);
  const [memberWithUnits] = await attachMemberUnits(supabase, [memberWithProfiles]);
  return NextResponse.json(memberWithUnits);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const memberId = cookieStore.get("member_id")?.value;
  let canAssignPosition = false;
  if (memberId !== id) {
    const { allowed, context } = await requirePermission("members.manage");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    canAssignPosition = ["super_admin", "pastor", "assistant_pastor"].includes(context?.role || "");
  }
  const body = await req.json();
  const {
    first_name,
    middle_name,
    last_name,
    phone_number,
    email,
    date_of_birth,
    position,
    member_type,
    institution,
    department,
    academic_level,
    student_status,
    residence,
    cell_group,
    nysc_state,
    nysc_ppa,
    employer,
    job_title,
    work_location,
    graduation_year,
    guardian_name,
    guardian_phone,
    skills_interests,
    units,
    photo_url,
    is_active,
  } = body;

  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("members")
    .update({
      first_name,
      middle_name: middle_name || null,
      last_name,
      phone_number: phone_number || null,
      email: email || null,
      date_of_birth,
      position: canAssignPosition ? position || null : undefined,
      member_type: member_type || "member",
      photo_url: photo_url ?? undefined,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profileError = await saveMemberProfiles(supabase, id, {
    member_type,
    institution,
    department,
    academic_level,
    student_status,
    residence,
    cell_group,
    nysc_state,
    nysc_ppa,
    employer,
    job_title,
    work_location,
    graduation_year,
    guardian_name,
    guardian_phone,
    skills_interests,
  });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  if (Array.isArray(units)) {
    const unitsError = await saveMemberUnits(supabase, id, units);
    if (unitsError) return NextResponse.json({ error: unitsError.message }, { status: 500 });
  }

  const [memberWithProfiles] = await attachMemberProfiles(supabase, [data]);
  const [memberWithUnits] = await attachMemberUnits(supabase, [memberWithProfiles]);
  return NextResponse.json(memberWithUnits);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission("members.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
