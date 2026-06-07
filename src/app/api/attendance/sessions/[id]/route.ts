import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission("attendance.view");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: session, error: sessionError }, { data: members, error: membersError }] = await Promise.all([
    supabase.from("attendance_sessions").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("members")
      .select("id, first_name, middle_name, last_name, phone_number, photo_url, is_active, member_type")
      .eq("is_active", true)
      .order("first_name", { ascending: true }),
  ]);

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });
  if (!session) return NextResponse.json({ error: "Attendance session not found" }, { status: 404 });
  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

  const [{ data: records, error: recordsError }, { data: followUps, error: followUpsError }] = await Promise.all([
    supabase.from("attendance_records").select("*").eq("session_id", id),
    supabase.from("absentee_followups").select("*").eq("session_id", id),
  ]);

  if (recordsError) return NextResponse.json({ error: recordsError.message }, { status: 500 });
  if (followUpsError) return NextResponse.json({ error: followUpsError.message }, { status: 500 });

  const recordsByMember = new Map((records || []).map(record => [record.member_id, record]));
  const followUpsByMember = new Map((followUps || []).map(followUp => [followUp.member_id, followUp]));

  const roster = (members || []).map(member => ({
    ...member,
    attendance: recordsByMember.get(member.id) || {
      session_id: id,
      member_id: member.id,
      status: "absent",
    },
    follow_up: followUpsByMember.get(member.id) || null,
  }));

  const presentCount = roster.filter(member => member.attendance.status === "present").length;
  const excusedCount = roster.filter(member => member.attendance.status === "excused").length;
  const absentCount = roster.length - presentCount - excusedCount;

  return NextResponse.json({
    session,
    roster,
    summary: {
      total: roster.length,
      present: presentCount,
      absent: absentCount,
      excused: excusedCount,
    },
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission("attendance.manage");
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
      service_type: service_type?.trim() || "service",
      session_date,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission("attendance.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("attendance_sessions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
