import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";

export async function GET() {
  const { allowed } = await requirePermission("attendance.view");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: sessions, error: sessionsError }, { count: activeMembers, error: membersError }] = await Promise.all([
    supabase
      .from("attendance_sessions")
      .select("*")
      .order("session_date", { ascending: false })
      .limit(12),
    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  if (sessionsError) return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

  const sessionIds = (sessions || []).map(session => session.id);

  if (sessionIds.length === 0) {
    return NextResponse.json({
      summary: {
        activeMembers: activeMembers || 0,
        averageAttendanceRate: 0,
        averagePresent: 0,
        totalSessions: 0,
      },
      sessions: [],
    });
  }

  const { data: records, error: recordsError } = await supabase
    .from("attendance_records")
    .select("session_id, status")
    .in("session_id", sessionIds);

  if (recordsError) return NextResponse.json({ error: recordsError.message }, { status: 500 });

  const recordsBySession = new Map<string, { present: number; absent: number; excused: number }>();

  for (const record of records || []) {
    const counts = recordsBySession.get(record.session_id) || { present: 0, absent: 0, excused: 0 };
    if (record.status === "present") counts.present += 1;
    if (record.status === "absent") counts.absent += 1;
    if (record.status === "excused") counts.excused += 1;
    recordsBySession.set(record.session_id, counts);
  }

  const sessionReports = (sessions || []).map(session => {
    const counts = recordsBySession.get(session.id) || { present: 0, absent: 0, excused: 0 };
    const totalMarked = counts.present + counts.absent + counts.excused;
    const expectedTotal = activeMembers || totalMarked;
    const attendanceRate = expectedTotal > 0 ? Math.round((counts.present / expectedTotal) * 100) : 0;

    return {
      ...session,
      ...counts,
      totalMarked,
      expectedTotal,
      attendanceRate,
    };
  });

  const totalPresent = sessionReports.reduce((sum, session) => sum + session.present, 0);
  const totalExpected = sessionReports.reduce((sum, session) => sum + session.expectedTotal, 0);

  return NextResponse.json({
    summary: {
      activeMembers: activeMembers || 0,
      averageAttendanceRate: totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0,
      averagePresent: sessionReports.length > 0 ? Math.round(totalPresent / sessionReports.length) : 0,
      totalSessions: sessionReports.length,
    },
    sessions: sessionReports,
  });
}
