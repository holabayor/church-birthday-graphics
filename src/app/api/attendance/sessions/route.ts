import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { SERVICE_TYPE } from "@/lib/attendanceStatus";
import { cacheKeys, getCached, invalidateCache } from "@/lib/serverCache";

export async function GET() {
  const { allowed } = await requirePermission(PERMISSION.ATTENDANCE_VIEW);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const cacheResult = await getCached(cacheKeys.attendanceSessions, 60, async () => {
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .order("session_date", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data || [];
  });

  if (!cacheResult.hit && (cacheResult.value as any)?.error) {
    return NextResponse.json({ error: (cacheResult.value as any).error }, { status: 500 });
  }

  return NextResponse.json({ data: cacheResult.value });
}

export async function POST(req: NextRequest) {
  const { allowed } = await requirePermission(PERMISSION.ATTENDANCE_MANAGE);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, service_type, session_date, notes } = await req.json();

  if (!title?.trim() || !session_date) {
    return NextResponse.json({ error: "Title and session date are required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("attendance_sessions")
    .insert({
      title: title.trim(),
      service_type: service_type?.trim() || SERVICE_TYPE.SERVICE,
      session_date,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  invalidateCache(cacheKeys.attendanceSessions);
  invalidateCache(cacheKeys.attendanceReports);

  return NextResponse.json(data, { status: 201 });
}
