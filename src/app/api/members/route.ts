import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { normalizePhoneNumber } from "@/lib/phone";
import { attachMemberProfiles, saveMemberProfiles } from "@/lib/memberProfiles";
import { attachMemberUnits, saveMemberUnits } from "@/lib/memberUnits";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { FILTER_VALUE } from "@/lib/filterOptions";
import { cacheKeys, invalidateCache, getCached } from "@/lib/serverCache";
import {
  LIFE_STAGE,
  MEMBERSHIP_STATUS,
  normalizeLifeStage,
  normalizeMembershipStatus,
  workingLifeStages,
} from "@/lib/memberLifecycle";

export async function GET(req: NextRequest) {
  const { allowed } = await requirePermission(PERMISSION.MEMBERS_VIEW);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || "";
  
  // Whitelisted sorting columns to prevent sorting injection
  const allowedSortFields = ["first_name", "middle_name", "last_name", "date_of_birth", "life_stage", "created_at"];
  const sort = allowedSortFields.includes(searchParams.get("sort") || "")
    ? searchParams.get("sort")!
    : "first_name";
  const order = searchParams.get("order") || "asc";
  const month = searchParams.get("month") || "";
  const lifeStage = searchParams.get("life_stage") || "";
  const unitId = searchParams.get("unit_id") || "";

  const monthNumber = month ? parseInt(month, 10) : NaN;
  const hasMonthFilter = Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Initialize query, optimizing unit_id filtering through PostgREST embedded joins
  let query;
  if (unitId && unitId !== FILTER_VALUE.ALL) {
    query = supabase
      .from("members")
      .select("*, church_unit_members!inner(unit_id)", { count: "exact" })
      .eq("church_unit_members.unit_id", unitId)
      .order(sort, { ascending: order === "asc" });
  } else {
    query = supabase
      .from("members")
      .select("*", { count: "exact" })
      .order(sort, { ascending: order === "asc" });
  }

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,middle_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_number.ilike.%${search}%,position.ilike.%${search}%,life_stage.ilike.%${search}%`,
    );
  }

  if (lifeStage && lifeStage !== FILTER_VALUE.ALL) {
    query = query.eq("life_stage", normalizeLifeStage(lifeStage));
  }

  // Optimized Month Filtering on DB level (O(page size) instead of loading 10k rows)
  if (hasMonthFilter) {
    query = query.eq("birth_month", monthNumber);
  }

  // Server-side caching for statistics counts
  const { value: stats } = await getCached(cacheKeys.memberStats, 60, async () => {
    const [{ count: totalCount }, { count: studentCount }, { count: workingCount }, { count: visitorCount }] =
      await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("members").select("*", { count: "exact", head: true }).eq("life_stage", LIFE_STAGE.STUDENT),
        supabase.from("members").select("*", { count: "exact", head: true }).in("life_stage", workingLifeStages),
        supabase.from("members").select("*", { count: "exact", head: true }).eq("life_stage", LIFE_STAGE.VISITOR),
      ]);
    return {
      total: totalCount || 0,
      students: studentCount || 0,
      working: workingCount || 0,
      visitors: visitorCount || 0,
    };
  });

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Supabase query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Clean the nested joined property from JSON response if present
  const cleanedData = (data || []).map((m: any) => {
    const { church_unit_members, ...rest } = m;
    return rest;
  });

  const dataWithProfiles = await attachMemberProfiles(supabase, cleanedData);
  const dataWithUnits = await attachMemberUnits(supabase, dataWithProfiles);
  return NextResponse.json({ data: dataWithUnits, total: count || 0, page, limit, stats });
}

export async function POST(req: NextRequest) {
  const { allowed } = await requirePermission(PERMISSION.MEMBERS_MANAGE);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    first_name,
    middle_name,
    last_name,
    phone_number,
    alternate_phone,
    email,
    date_of_birth,
    position,
    life_stage,
    membership_status,
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
      phone_number: phone_number ? normalizePhoneNumber(phone_number) : null,
      alternate_phone: alternate_phone ? normalizePhoneNumber(alternate_phone) : null,
      email: email || null,
      date_of_birth,
      position: position || null,
      life_stage: normalizeLifeStage(life_stage),
      membership_status: normalizeMembershipStatus(membership_status || MEMBERSHIP_STATUS.ACTIVE),
      photo_url: photo_url || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST204" || error.code === "PGRST205" || error.code === "42P01") {
      return NextResponse.json(
        {
          error:
            "Database migration required. Run the latest SUPABASE_SETUP.md migration so members.life_stage, members.membership_status, and profile/unit tables exist.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profileError = await saveMemberProfiles(supabase, data.id, {
    life_stage,
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
  invalidateCache(cacheKeys.units);
  invalidateCache(cacheKeys.unitsManagement);
  invalidateCache("unit");
  invalidateCache(cacheKeys.memberStats);
  return NextResponse.json(memberWithUnits, { status: 201 });
}
