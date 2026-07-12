import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { slugify } from "@/lib/utils";
import { cacheKeys, getCached, invalidateCache } from "@/lib/serverCache";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check if user has poll management permission
  const { allowed } = await requirePermission(PERMISSION.POLLS_MANAGE);

  const cacheResult = await getCached(cacheKeys.pollsRaw, 30, async () => {
    const { data, error } = await supabase
      .from("polls")
      .select("*, poll_candidates(*)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  });

  if (!cacheResult.hit && (cacheResult.value as any)?.error) {
    return NextResponse.json({ error: (cacheResult.value as any).error }, { status: 500 });
  }

  const rawPolls = cacheResult.value as any[] || [];

  // If admin, return all polls directly
  if (allowed) {
    return NextResponse.json({ data: rawPolls });
  }

  // Guest or non-admin member sees only active polls
  const activePolls = rawPolls.filter(poll => poll.status === "active");

  // Resolve member auth session details directly from cookies (bypassing loopback HTTP fetch)
  let memberId = cookieStore.get("member_id")?.value || null;
  if (!memberId) {
    const { data: { user } } = await supabase.auth.getUser();
    memberId = user?.id || null;
  }

  // Get member unit assignments if logged in
  let unitIds: string[] = [];
  if (memberId) {
    const { data: memberUnits } = await supabase
      .from("church_unit_members")
      .select("unit_id")
      .eq("member_id", memberId);
    unitIds = (memberUnits || []).map((mu: any) => mu.unit_id);
  }

  // Check user vote cast history
  let votedPollIds: string[] = [];
  if (memberId) {
    const { data: userVotes } = await supabase
      .from("poll_votes")
      .select("poll_id")
      .eq("voter_member_id", memberId);
    votedPollIds = (userVotes || []).map((v: any) => v.poll_id);
  } else {
    // Anonymous anti-cheat check
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const fingerprint = req.nextUrl.searchParams.get("fingerprint") || "";
    let anonymousVotesQuery = supabase.from("poll_votes").select("poll_id");
    if (fingerprint) {
      anonymousVotesQuery = anonymousVotesQuery.or(`voter_ip.eq.${ip},voter_fingerprint.eq.${fingerprint}`);
    } else {
      anonymousVotesQuery = anonymousVotesQuery.eq("voter_ip", ip);
    }
    const { data: anonymousVotes } = await anonymousVotesQuery;
    votedPollIds = (anonymousVotes || []).map((v: any) => v.poll_id);
  }

  const pollsWithEligibility = activePolls.map((poll: any) => {
    let isEligible = false;
    if (poll.voter_type === "anyone") {
      isEligible = true;
    } else if (memberId) {
      if (poll.voter_type === "members") {
        isEligible = true;
      } else if (poll.voter_type === "workers") {
        isEligible = unitIds.length > 0;
      } else if (poll.voter_type === "selected_groups") {
        isEligible = Array.isArray(poll.allowed_groups) && poll.allowed_groups.some((g: string) => unitIds.includes(g));
      }
    }
    return {
      ...poll,
      is_eligible: isEligible,
      has_voted: votedPollIds.includes(poll.id),
    };
  });

  return NextResponse.json({ data: pollsWithEligibility });
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

    // 1. Insert the poll details (generating slug)
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        title,
        slug: slugify(title),
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

    invalidateCache(cacheKeys.pollsRaw);

    return NextResponse.json(finalPoll, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid JSON payload" }, { status: 400 });
  }
}
