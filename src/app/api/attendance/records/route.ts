import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { attendanceStatusOptions } from "@/lib/attendanceStatus";
import { cacheKeys, invalidateCache } from "@/lib/serverCache";

const allowedStatuses = new Set(attendanceStatusOptions.map(option => option.value));

export async function POST(req: NextRequest) {
  const { allowed } = await requirePermission(PERMISSION.ATTENDANCE_MANAGE);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { session_id, member_id, status } = await req.json();

  if (!session_id || !member_id || !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Session, member, and a valid status are required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("attendance_records")
    .upsert({
      session_id,
      member_id,
      status,
      marked_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  invalidateCache(cacheKeys.attendanceReports);
  invalidateCache(cacheKeys.attendanceSession(session_id));

  return NextResponse.json(data);
}
