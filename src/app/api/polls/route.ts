import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check if user has poll management permission
  const { allowed } = await requirePermission(PERMISSION.POLLS_MANAGE);

  let query = supabase.from("polls").select("*, poll_candidates(*)");

  if (!allowed) {
    // Guests or non-admin members can only see active polls
    query = query.eq("status", "active");
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const { allowed } = await requirePermission(PERMISSION.POLLS_MANAGE);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      voter_type,
      allowed_groups,
      starts_at,
      ends_at,
      allow_view_results,
      candidates,
    } = body;

    if (!title || !voter_type || !starts_at || !ends_at) {
      return NextResponse.json({ error: "Title, voter type, start date, and end date are required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Insert the poll details
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        title,
        description: description || null,
        voter_type,
        allowed_groups: allowed_groups || [],
        status: "draft",
        starts_at,
        ends_at,
        allow_view_results: allow_view_results !== false,
      })
      .select()
      .single();

    if (pollError) {
      return NextResponse.json({ error: pollError.message }, { status: 500 });
    }

    // 2. Insert nominees if provided
    if (Array.isArray(candidates) && candidates.length > 0) {
      const candidatesToInsert = candidates.map((cand: any) => ({
        poll_id: poll.id,
        member_id: cand.member_id || null,
        display_name: cand.display_name,
        photo_url: cand.photo_url || null,
        nomination_reason: cand.nomination_reason || null,
      }));

      const { error: candError } = await supabase.from("poll_candidates").insert(candidatesToInsert);
      if (candError) {
        // Roll back the created poll if candidates fail to insert
        await supabase.from("polls").delete().eq("id", poll.id);
        return NextResponse.json({ error: candError.message }, { status: 500 });
      }
    }

    // Fetch the final merged poll object with candidates
    const { data: finalPoll, error: finalError } = await supabase
      .from("polls")
      .select("*, poll_candidates(*)")
      .eq("id", poll.id)
      .single();

    if (finalError) {
      return NextResponse.json({ error: finalError.message }, { status: 500 });
    }

    return NextResponse.json(finalPoll, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid JSON payload" }, { status: 400 });
  }
}
