import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { ATTENDANCE_STATUS, SERVICE_TYPE } from "@/lib/attendanceStatus";
import { MEMBERSHIP_STATUS } from "@/lib/memberLifecycle";
import { cacheKeys, getCached, invalidateCache } from "@/lib/serverCache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission(PERMISSION.ATTENDANCE_VIEW);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const cacheResult = await getCached(cacheKeys.attendanceSession(id), 30, async () => {
    const [{ data: session, error: sessionError }, { data: members, error: membersError }] = await Promise.all([
      supabase.from("attendance_sessions").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("members")
        .select("id, first_name, middle_name, last_name, phone_number, photo_url, membership_status, is_active, life_stage")
        .eq("membership_status", MEMBERSHIP_STATUS.ACTIVE)
        .order("first_name", { ascending: true }),
    ]);

    if (sessionError) throw new Error(sessionError.message);
    if (!session) throw new Error("Attendance session not found");
    if (membersError) throw new Error(membersError.message);

    const [{ data: records, error: recordsError }, { data: followUps, error: followUpsError }] = await Promise.all([
      supabase.from("attendance_records").select("*").eq("session_id", id),
      supabase.from("absentee_followups").select("*").eq("session_id", id),
    ]);

    if (recordsError) throw new Error(recordsError.message);
    if (followUpsError) throw new Error(followUpsError.message);

    const recordsByMember = new Map((records || []).map(record => [record.member_id, record]));
    const followUpsByMember = new Map((followUps || []).map(followUp => [followUp.member_id, followUp]));

    const roster = (members || []).map(member => ({
      ...member,
      attendance: recordsByMember.get(member.id) || {
        session_id: id,
        member_id: member.id,
        status: ATTENDANCE_STATUS.ABSENT,
      },
      follow_up: followUpsByMember.get(member.id) || null,
    }));

    const presentCount = roster.filter(member => member.attendance.status === ATTENDANCE_STATUS.PRESENT).length;
    const excusedCount = roster.filter(member => member.attendance.status === ATTENDANCE_STATUS.EXCUSED).length;
    const absentCount = roster.length - presentCount - excusedCount;

    return {
      session,
      roster,
      summary: {
        total: roster.length,
        present: presentCount,
        absent: absentCount,
        excused: excusedCount,
      },
    };
  });

  if (!cacheResult.hit && (cacheResult.value as any)?.error) {
    const errorMsg = (cacheResult.value as any).error;
    const status = errorMsg === "Attendance session not found" ? 404 : 500;
    return NextResponse.json({ error: errorMsg }, { status });
  }

  return NextResponse.json(cacheResult.value);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission(PERMISSION.ATTENDANCE_MANAGE);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { title, service_type, session_date, notes } = await req.json();

  if (!title?.trim() || !session_date) {
    return NextResponse.json({ error: "Title and session date are required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("attendance_sessions")
    .update({
      title: title.trim(),
      service_type: service_type?.trim() || SERVICE_TYPE.SERVICE,
      session_date,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  invalidateCache(cacheKeys.attendanceSessions);
  invalidateCache(cacheKeys.attendanceReports);
  invalidateCache(cacheKeys.attendanceSession(id));

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission(PERMISSION.ATTENDANCE_MANAGE);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("attendance_sessions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  invalidateCache(cacheKeys.attendanceSessions);
  invalidateCache(cacheKeys.attendanceReports);
  invalidateCache(cacheKeys.attendanceSession(id));

  return NextResponse.json({ success: true });
}
