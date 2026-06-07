import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/adminPermissions";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { attachMemberUnits } from "@/lib/memberUnits";

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
  member_type: member.member_type || "member",
  units: member.units || [],
  ...extra,
});

export async function GET(req: NextRequest) {
  const { allowed } = await requirePermission("outreach.view");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type = req.nextUrl.searchParams.get("type") || "birthdays";
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  if (type === "birthdays") {
    const range = req.nextUrl.searchParams.get("range") || "today";
    const daysAhead = range === "week" ? 7 : range === "month" ? 31 : 0;

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("is_active", true)
      .not("phone_number", "is", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const membersWithUnits = await attachMemberUnits(supabase, data || []);
    const rows = membersWithUnits
      .filter(member => member.date_of_birth && isBirthdayInRange(member.date_of_birth, daysAhead))
      .map(member => formatMember(member, { date_of_birth: member.date_of_birth }));

    return NextResponse.json({ data: rows });
  }

  if (type === "absentees") {
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
      .eq("status", "absent");

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
          follow_up_status: row.absentee_followups?.[0]?.status || "pending",
          assigned_to: row.absentee_followups?.[0]?.assigned_to || null,
        }
      ));

    return NextResponse.json({ data: rows });
  }

  if (type === "units") {
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
