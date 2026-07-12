import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { ATTENDANCE_STATUS } from "@/lib/attendanceStatus";
import { MEMBERSHIP_STATUS } from "@/lib/memberLifecycle";
import { cacheKeys, getCached } from "@/lib/serverCache";

export async function GET() {
  const { allowed } = await requirePermission(PERMISSION.ATTENDANCE_VIEW);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const cacheResult = await getCached(cacheKeys.attendanceReports, 60, async () => {
    const [{ data: sessions, error: sessionsError }, { count: activeMembers, error: membersError }] = await Promise.all([
      supabase
        .from("attendance_sessions")
        .select("*")
        .order("session_date", { ascending: false })
        .limit(12),
      supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("membership_status", MEMBERSHIP_STATUS.ACTIVE),
    ]);

    if (sessionsError) throw new Error(sessionsError.message);
    if (membersError) throw new Error(membersError.message);

    const sessionIds = (sessions || []).map(session => session.id);

    if (sessionIds.length === 0) {
      return {
        summary: {
          activeMembers: activeMembers || 0,
          averageAttendanceRate: 0,
          averagePresent: 0,
          totalSessions: 0,
        },
        sessions: [],
      };
    }

    const { data: records, error: recordsError } = await supabase
      .from("attendance_records")
      .select("session_id, status")
      .in("session_id", sessionIds);

    if (recordsError) throw new Error(recordsError.message);

    const recordsBySession = new Map<string, { present: number; absent: number; excused: number }>();

    for (const record of records || []) {
      const counts = recordsBySession.get(record.session_id) || { present: 0, absent: 0, excused: 0 };
      if (record.status === ATTENDANCE_STATUS.PRESENT) counts.present += 1;
      if (record.status === ATTENDANCE_STATUS.ABSENT) counts.absent += 1;
      if (record.status === ATTENDANCE_STATUS.EXCUSED) counts.excused += 1;
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

    return {
      summary: {
        activeMembers: activeMembers || 0,
        averageAttendanceRate: totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0,
        averagePresent: sessionReports.length > 0 ? Math.round(totalPresent / sessionReports.length) : 0,
        totalSessions: sessionReports.length,
      },
      sessions: sessionReports,
    };
  });

  if (!cacheResult.hit && (cacheResult.value as any)?.error) {
    return NextResponse.json({ error: (cacheResult.value as any).error }, { status: 500 });
  }

  return NextResponse.json(cacheResult.value);
}
