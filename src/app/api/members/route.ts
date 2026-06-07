import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { attachMemberProfiles, saveMemberProfiles } from "@/lib/memberProfiles";
import { attachMemberUnits, saveMemberUnits } from "@/lib/memberUnits";
import { requirePermission } from "@/lib/adminPermissions";

export async function GET(req: NextRequest) {
  const { allowed } = await requirePermission("members.view");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "first_name";
  const order = searchParams.get("order") || "asc";
  const month = searchParams.get("month") || "";
  const monthNumber = month ? parseInt(month, 10) : NaN;
  const hasMonthFilter = Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase.from("members").select("*", { count: "exact" }).order(sort, { ascending: order === "asc" });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_number.ilike.%${search}%,position.ilike.%${search}%,member_type.ilike.%${search}%`);
  }

  if (hasMonthFilter) {
    const { data, error } = await query.range(0, 9999);

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const filtered = (data || []).filter(member => {
      const birthMonth = parseInt(String(member.date_of_birth).split("-")[1] || "", 10);
      return birthMonth === monthNumber;
    });

    const pageData = filtered.slice(from, to + 1);
    const dataWithProfiles = await attachMemberProfiles(supabase, pageData);
    const dataWithUnits = await attachMemberUnits(supabase, dataWithProfiles);

    return NextResponse.json({
      data: dataWithUnits,
      total: filtered.length,
      page,
      limit,
    });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Supabase query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const dataWithProfiles = await attachMemberProfiles(supabase, data || []);
  const dataWithUnits = await attachMemberUnits(supabase, dataWithProfiles);
  return NextResponse.json({ data: dataWithUnits, total: count || 0, page, limit });
}

export async function POST(req: NextRequest) {
  const { allowed } = await requirePermission("members.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  } = body;

  if (!first_name || !last_name || !date_of_birth) {
    return NextResponse.json({ error: "First name, last name, and date of birth are required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("members")
    .insert({
      first_name,
      middle_name: middle_name || null,
      last_name,
      phone_number: phone_number || null,
      email: email || null,
      date_of_birth,
      position: position || null,
      member_type: member_type || "member",
      photo_url: photo_url || null,
    })
    .select()
    .single();

    console.log("Error creating member profile", error)
  if (error) {
    if (error.code === "PGRST204" || error.code === "PGRST205" || error.code === "42P01") {
      return NextResponse.json({
        error: "Database migration required. Run the latest SUPABASE_SETUP.md migration so members.member_type and profile/unit tables exist.",
      }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profileError = await saveMemberProfiles(supabase, data.id, {
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
    const unitsError = await saveMemberUnits(supabase, data.id, units);
    if (unitsError) return NextResponse.json({ error: unitsError.message }, { status: 500 });
  }

  const [memberWithProfiles] = await attachMemberProfiles(supabase, [data]);
  const [memberWithUnits] = await attachMemberUnits(supabase, [memberWithProfiles]);
  return NextResponse.json(memberWithUnits, { status: 201 });
}
