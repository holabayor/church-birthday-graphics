import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const memberId = cookieStore.get("member_id")?.value;
    const supabase = createClient(cookieStore);

    if (!memberId) {
      return NextResponse.json({ error: "Member profile required" }, { status: 401 });
    }

    const [meRes, unitsRes, unitMembersRes, pollsRes] = await Promise.all([
      supabase.from("members").select("id, position").eq("id", memberId).maybeSingle(),
      supabase.from("church_units").select("id, name, description").order("name", { ascending: true }),
      supabase.from("church_unit_members").select("unit_id, member_id, role"),
      supabase
        .from("polls")
        .select("id, slug, title, description, starts_at, ends_at, status, voter_type, allowed_groups")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

    const unitAssignments = unitMembersRes.data || [];
    const myAssignments = unitAssignments.filter((um: any) => um.member_id === memberId);
    const myUnitIds = new Set(myAssignments.map((um: any) => um.unit_id));

    const allUnits = (unitsRes.data || []).map((unit: any) => {
      const count = unitAssignments.filter((um: any) => um.unit_id === unit.id).length;
      const myEntry = myAssignments.find((um: any) => um.unit_id === unit.id);
      return {
        id: unit.id,
        name: unit.name,
        description: unit.description,
        member_count: count,
        my_role: myEntry ? myEntry.role : null,
      };
    });

    const now = new Date();
    const isWorker = myUnitIds.size > 0 || Boolean(meRes.data?.position && meRes.data.position.trim());

    const activePolls = (pollsRes.data || []).filter((p: any) => {
      const endsAt = new Date(p.ends_at);
      if (now > endsAt) return false;
      if (p.voter_type === "workers" && !isWorker) return false;
      if (p.voter_type === "selected_groups" && Array.isArray(p.allowed_groups) && p.allowed_groups.length > 0) {
        return p.allowed_groups.some((gid: string) => myUnitIds.has(gid));
      }
      return true;
    });

    return NextResponse.json({
      units: allUnits,
      activePolls,
    });
  } catch (err: any) {
    console.error("Failed to load member dashboard:", err);
    return NextResponse.json({ error: "Failed to load member dashboard" }, { status: 500 });
  }
}
