import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pollId } = await params;

  try {
    const body = await req.json();
    const { candidateId, fingerprint } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Fetch poll details
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("*")
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // 2. Validate poll status and timelines
    if (poll.status !== "active") {
      return NextResponse.json({ error: "Voting is not currently active for this poll" }, { status: 400 });
    }

    const now = new Date();
    const start = new Date(poll.starts_at);
    const end = new Date(poll.ends_at);
    if (now < start || now > end) {
      return NextResponse.json({ error: "Voting timeline is outside the active range" }, { status: 400 });
    }

    // 3. Resolve member auth session details
    let memberId: string | null = null;
    try {
      const authRes = await fetch(`${req.nextUrl.origin}/api/auth`, {
        headers: { cookie: req.headers.get("cookie") || "" },
      });
      if (authRes.ok) {
        const authJson = await authRes.json();
        memberId = authJson.member?.id || authJson.user?.id || null;
      }
    } catch (e) {
      console.error("Auth fetch failed in vote API", e);
    }

    // 4. Validate voter segmentation permissions
    if (poll.voter_type !== "anyone") {
      if (!memberId) {
        return NextResponse.json({ error: "Authentication is required to vote on this poll" }, { status: 401 });
      }

      if (poll.voter_type === "workers") {
        // Must belong to at least one active unit
        const { data: units, error: unitError } = await supabase
          .from("church_unit_members")
          .select("unit_id")
          .eq("member_id", memberId)
          .limit(1);

        if (unitError || !units || units.length === 0) {
          return NextResponse.json({ error: "Only church workers/unit leaders can vote on this poll" }, { status: 403 });
        }
      } else if (poll.voter_type === "selected_groups") {
        // Must belong to one of the specified allowed groups
        if (!Array.isArray(poll.allowed_groups) || poll.allowed_groups.length === 0) {
          return NextResponse.json({ error: "Poll is not open to any groups yet" }, { status: 400 });
        }

        const { data: units, error: unitError } = await supabase
          .from("church_unit_members")
          .select("unit_id")
          .eq("member_id", memberId)
          .in("unit_id", poll.allowed_groups)
          .limit(1);

        if (unitError || !units || units.length === 0) {
          return NextResponse.json({ error: "Your church unit does not have permission to vote in this poll" }, { status: 403 });
        }
      }
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // 5. Prevent double voting
    if (memberId) {
      const { data: existingVote } = await supabase
        .from("poll_votes")
        .select("id")
        .eq("poll_id", pollId)
        .eq("voter_member_id", memberId)
        .maybeSingle();

      if (existingVote) {
        return NextResponse.json({ error: "You have already cast your vote in this poll" }, { status: 409 });
      }
    } else {
      // Anonymous anti-cheat checks
      let query = supabase.from("poll_votes").select("id").eq("poll_id", pollId);
      if (fingerprint) {
        query = query.or(`voter_ip.eq.${ip},voter_fingerprint.eq.${fingerprint}`);
      } else {
        query = query.eq("voter_ip", ip);
      }

      const { data: existingVote } = await query.limit(1).maybeSingle();
      if (existingVote) {
        return NextResponse.json({ error: "A vote has already been cast from this device or network connection" }, { status: 409 });
      }
    }

    // 6. Record the vote in database
    const { error: voteError } = await supabase
      .from("poll_votes")
      .insert({
        poll_id: pollId,
        candidate_id: candidateId,
        voter_member_id: memberId,
        voter_ip: ip,
        voter_fingerprint: fingerprint || null,
      });

    if (voteError) {
      // Capture unique constraint failures (23505) gracefully
      if (voteError.code === "23505") {
        return NextResponse.json({ error: "You have already cast a vote in this poll" }, { status: 409 });
      }
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Vote cast successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process vote request" }, { status: 500 });
  }
}
