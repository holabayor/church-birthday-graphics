import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { cacheKeys, invalidateCache } from "@/lib/serverCache";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pollId } = await params;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Fetch the poll details and nominees (supporting slug or UUID lookup, and joining member units)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pollId);
  let pollQuery = supabase
    .from("polls")
    .select(`
      *, 
      poll_candidates(
        *, 
        members(
          id, 
          first_name, 
          last_name, 
          photo_url, 
          position,
          church_unit_members(
            role, 
            church_units(
              id, 
              name
            )
          )
        )
      )
    `)
    .eq(isUuid ? "id" : "slug", pollId);
  const { data: poll, error: pollError } = await pollQuery.maybeSingle();

  if (pollError || !poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  // Check if current user is an admin
  const { allowed: isAdmin } = await requirePermission(PERMISSION.POLLS_MANAGE);

  // Resolve member authentication from session cookies directly (bypassing loopback fetches)
  let memberId = cookieStore.get("member_id")?.value || null;
  if (!memberId) {
    const { data: { user } } = await supabase.auth.getUser();
    memberId = user?.id || null;
  }

  // If not admin, validate status and access rights
  if (!isAdmin) {
    if (poll.status === "draft") {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (!memberId) {
      // Unauthenticated public can only view active, public polls
      if (poll.status !== "active" || poll.voter_type !== "anyone") {
        return NextResponse.json({ error: "Authentication is required to view this poll" }, { status: 401 });
      }
    }
  }

  // 2. Fetch the votes data if admin or if the results are configured as viewable
  let votesData: any[] = [];
  const showResults = isAdmin || poll.allow_view_results || poll.status === "closed";

  if (showResults) {
    const { data: votes, error: votesError } = await supabase
      .from("poll_votes")
      .select("candidate_id")
      .eq("poll_id", poll.id);
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

  const candidatesWithVotes = poll.poll_candidates.map((cand: any) => {
    const units = cand.members?.church_unit_members?.map((cum: any) => ({
      name: cum.church_units?.name,
      role: cum.role,
    })).filter((u: any) => !!u.name) || [];
    return {
      id: cand.id,
      poll_id: cand.poll_id,
      member_id: cand.member_id,
      display_name: cand.display_name,
      photo_url: cand.photo_url || cand.members?.photo_url || null,
      nomination_reason: cand.nomination_reason,
      created_at: cand.created_at,
      votes: showResults ? votesCount[cand.id] : null,
      departments: units,
      position: cand.members?.position || null,
    };
  });

  // 4. Determine if the current visitor has already voted in this poll
  let hasVoted = false;
  let votedCandidateId: string | null = null;

  if (memberId) {
    // Authenticated member check
    const { data: memberVote } = await supabase
      .from("poll_votes")
      .select("candidate_id")
      .eq("poll_id", poll.id)
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

    let query = supabase.from("poll_votes").select("candidate_id").eq("poll_id", poll.id);
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

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pollId);
    const { error: pollError } = await supabase
      .from("polls")
      .update(updateData)
      .eq(isUuid ? "id" : "slug", pollId);

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

    invalidateCache(cacheKeys.pollsRaw);

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

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pollId);

  // Fetch current poll status to check if it's ongoing
  const { data: poll, error: fetchError } = await supabase
    .from("polls")
    .select("status")
    .eq(isUuid ? "id" : "slug", pollId)
    .maybeSingle();

  if (fetchError || !poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  if (poll.status === "active") {
    return NextResponse.json({ error: "Ongoing polls cannot be deleted. Please close the poll first." }, { status: 400 });
  }

  const { error } = await supabase.from("polls").delete().eq(isUuid ? "id" : "slug", pollId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateCache(cacheKeys.pollsRaw);

  return NextResponse.json({ message: "Poll deleted successfully" });
}
