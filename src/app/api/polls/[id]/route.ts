import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pollId } = await params;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Fetch the poll details and nominees
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*, poll_candidates(*)")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  // Check if current user is an admin
  const { allowed: isAdmin } = await requirePermission(PERMISSION.POLLS_MANAGE);

  // 2. Fetch the votes data if admin or if the poll is closed and results are viewable
  let votesData: any[] = [];
  const showResults = isAdmin || (poll.status === "closed" && poll.allow_view_results);

  if (showResults) {
    const { data: votes, error: votesError } = await supabase
      .from("poll_votes")
      .select("candidate_id")
      .eq("poll_id", pollId);
    if (!votesError && votes) {
      votesData = votes;
    }
  }

  // 3. Count votes for each candidate
  const votesCount: Record<string, number> = {};
  poll.poll_candidates.forEach((cand: any) => {
    votesCount[cand.id] = 0;
  });
  votesData.forEach((vote: any) => {
    if (votesCount[vote.candidate_id] !== undefined) {
      votesCount[vote.candidate_id]++;
    }
  });

  const candidatesWithVotes = poll.poll_candidates.map((cand: any) => ({
    ...cand,
    votes: showResults ? votesCount[cand.id] : null,
  }));

  // 4. Determine if the current visitor has already voted in this poll
  let hasVoted = false;
  let votedCandidateId: string | null = null;
  let memberId: string | null = null;

  // Resolve member authentication from session cookies
  try {
    const authRes = await fetch(`${req.nextUrl.origin}/api/auth`, {
      headers: { cookie: req.headers.get("cookie") || "" },
    });
    if (authRes.ok) {
      const authJson = await authRes.json();
      memberId = authJson.member?.id || authJson.user?.id || null;
    }
  } catch (e) {
    console.error("Auth fetch failed in polls GET endpoint", e);
  }

  if (memberId) {
    // Authenticated member check
    const { data: memberVote } = await supabase
      .from("poll_votes")
      .select("candidate_id")
      .eq("poll_id", pollId)
      .eq("voter_member_id", memberId)
      .maybeSingle();

    if (memberVote) {
      hasVoted = true;
      votedCandidateId = memberVote.candidate_id;
    }
  } else {
    // Anonymous public check (IP and Browser Fingerprint)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const fingerprint = req.nextUrl.searchParams.get("fingerprint") || "";

    let query = supabase.from("poll_votes").select("candidate_id").eq("poll_id", pollId);
    if (fingerprint) {
      query = query.or(`voter_ip.eq.${ip},voter_fingerprint.eq.${fingerprint}`);
    } else {
      query = query.eq("voter_ip", ip);
    }

    const { data: anonymousVote } = await query.limit(1).maybeSingle();
    if (anonymousVote) {
      hasVoted = true;
      votedCandidateId = anonymousVote.candidate_id;
    }
  }

  return NextResponse.json({
    poll: {
      ...poll,
      poll_candidates: candidatesWithVotes,
    },
    hasVoted,
    votedCandidateId,
    totalVotes: votesData.length,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pollId } = await params;
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
      status,
      starts_at,
      ends_at,
      allow_view_results,
      candidates,
    } = body;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (voter_type !== undefined) updateData.voter_type = voter_type;
    if (allowed_groups !== undefined) updateData.allowed_groups = allowed_groups;
    if (status !== undefined) updateData.status = status;
    if (starts_at !== undefined) updateData.starts_at = starts_at;
    if (ends_at !== undefined) updateData.ends_at = ends_at;
    if (allow_view_results !== undefined) updateData.allow_view_results = allow_view_results;

    const { error: pollError } = await supabase
      .from("polls")
      .update(updateData)
      .eq("id", pollId);

    if (pollError) {
      return NextResponse.json({ error: pollError.message }, { status: 500 });
    }

    // Replace nominees if a list is provided in payload
    if (Array.isArray(candidates)) {
      await supabase.from("poll_candidates").delete().eq("poll_id", pollId);

      const candidatesToInsert = candidates.map((cand: any) => ({
        poll_id: pollId,
        member_id: cand.member_id || null,
        display_name: cand.display_name,
        photo_url: cand.photo_url || null,
        nomination_reason: cand.nomination_reason || null,
      }));

      const { error: candError } = await supabase.from("poll_candidates").insert(candidatesToInsert);
      if (candError) {
        return NextResponse.json({ error: candError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "Poll updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pollId } = await params;
  const { allowed } = await requirePermission(PERMISSION.POLLS_MANAGE);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("polls").delete().eq("id", pollId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Poll deleted successfully" });
}
