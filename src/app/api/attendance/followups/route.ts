import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";

const allowedStatuses = new Set(["pending", "contacted", "visited", "resolved", "no_response"]);

export async function POST(req: NextRequest) {
  const { allowed } = await requirePermission("followups.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { session_id, member_id, status, notes, assigned_to } = await req.json();

  if (!session_id || !member_id || !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Session, member, and a valid follow-up status are required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("absentee_followups")
    .upsert({
      session_id,
      member_id,
      status,
      notes: notes?.trim() || null,
      assigned_to: assigned_to?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
