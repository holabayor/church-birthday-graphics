import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { attachMemberUnits } from "@/lib/memberUnits";
import { MEMBERSHIP_STATUS, normalizeLifeStage } from "@/lib/memberLifecycle";
import { ATTENDANCE_STATUS, FOLLOW_UP_STATUS } from "@/lib/attendanceStatus";
import { BIRTHDAY_RANGE, OUTREACH_TYPE } from "@/lib/outreachOptions";

const isBirthdayInRange = (dateOfBirth: string, daysAhead: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setDate(today.getDate() + daysAhead);

  const dob = new Date(dateOfBirth);
  const birthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (birthday < today) birthday.setFullYear(today.getFullYear() + 1);

  return birthday >= today && birthday <= end;
};

const formatMember = (member: any, extra: Record<string, unknown> = {}) => ({
  id: member.id,
  first_name: member.first_name,
  middle_name: member.middle_name,
  last_name: member.last_name,
  name: [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" "),
  phone_number: member.phone_number,
  email: member.email,
  life_stage: normalizeLifeStage(member.life_stage),
  units: member.units || [],
  ...extra,
});

export async function GET(req: NextRequest) {
  const { allowed } = await requirePermission(PERMISSION.OUTREACH_VIEW);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type = req.nextUrl.searchParams.get("type") || OUTREACH_TYPE.BIRTHDAYS;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  if (type === OUTREACH_TYPE.BIRTHDAYS) {
    const range = req.nextUrl.searchParams.get("range") || BIRTHDAY_RANGE.TODAY;
    const daysAhead = range === BIRTHDAY_RANGE.WEEK ? 7 : range === BIRTHDAY_RANGE.MONTH ? 31 : 0;

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("membership_status", MEMBERSHIP_STATUS.ACTIVE)
      .not("phone_number", "is", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const membersWithUnits = await attachMemberUnits(supabase, data || []);
    const rows = membersWithUnits
      .filter(member => member.date_of_birth && isBirthdayInRange(member.date_of_birth, daysAhead))
      .map(member => formatMember(member, { date_of_birth: member.date_of_birth }));

    return NextResponse.json({ data: rows });
  }

  if (type === OUTREACH_TYPE.ABSENTEES) {
    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) return NextResponse.json({ error: "session_id is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("attendance_records")
      .select(`
        status,
        members(*),
        absentee_followups(status, notes, assigned_to)
      `)
      .eq("session_id", sessionId)
      .eq("status", ATTENDANCE_STATUS.ABSENT);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const members = (data || []).map((row: any) => row.members).filter(Boolean);
    const membersWithUnits = await attachMemberUnits(supabase, members);
    const unitsByMember = new Map(membersWithUnits.map((member: any) => [member.id, member.units || []]));

    const rows = (data || [])
      .filter((row: any) => row.members?.phone_number)
      .map((row: any) => formatMember(
        { ...row.members, units: unitsByMember.get(row.members.id) || [] },
        {
          attendance_status: row.status,
          follow_up_status: row.absentee_followups?.[0]?.status || FOLLOW_UP_STATUS.PENDING,
          assigned_to: row.absentee_followups?.[0]?.assigned_to || null,
        }
      ));

    return NextResponse.json({ data: rows });
  }

  if (type === OUTREACH_TYPE.UNITS) {
    const unitId = req.nextUrl.searchParams.get("unit_id");
    if (!unitId) return NextResponse.json({ error: "unit_id is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("church_unit_members")
      .select("role, members(*)")
      .eq("unit_id", unitId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data || [])
      .filter((row: any) => row.members?.phone_number)
      .map((row: any) => formatMember(row.members, { unit_role: row.role }));

    return NextResponse.json({ data: rows });
  }

  return NextResponse.json({ error: "Unknown outreach type" }, { status: 400 });
}
