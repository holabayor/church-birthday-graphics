import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/server";
import { getUnitAccess } from "@/lib/unitAccess";

export async function GET() {
  const cookieStore = await cookies();
  const access = await getUnitAccess(cookieStore);

  if (!access.canViewAllUnits && access.manageableUnitIds.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createClient(cookieStore);
  let unitsQuery = supabase.from("church_units").select("*").order("name", { ascending: true });

  if (!access.canViewAllUnits) {
    unitsQuery = unitsQuery.in("id", access.manageableUnitIds);
  }

  const { data: units, error: unitsError } = await unitsQuery;
  if (unitsError) return NextResponse.json({ error: unitsError.message }, { status: 500 });

  const unitIds = (units || []).map(unit => unit.id);
  const membersByUnit = new Map<string, any[]>();

  if (unitIds.length > 0) {
    const { data: memberRows, error: membersError } = await supabase
      .from("church_unit_members")
      .select("unit_id, role, created_at, members(id, first_name, middle_name, last_name, phone_number, email, member_type, photo_url, is_active)")
      .in("unit_id", unitIds);

    if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

    for (const row of memberRows || []) {
      const member = Array.isArray(row.members) ? row.members[0] : row.members;
      if (!member) continue;

      const members = membersByUnit.get(row.unit_id) || [];
      members.push({
        ...member,
        unit_role: row.role || "member",
        joined_at: row.created_at,
      });
      membersByUnit.set(row.unit_id, members);
    }
  }

  return NextResponse.json({
    data: (units || []).map(unit => {
      const members = membersByUnit.get(unit.id) || [];
      const leaders = members.filter(member => member.unit_role === "head");
      const assistants = members.filter(member => member.unit_role === "assistant");

      return {
        ...unit,
        members,
        stats: {
          total_members: members.length,
          heads: leaders.length,
          assistants: assistants.length,
        },
        access: {
          can_manage_details: access.canManageAllUnits,
          can_manage_members: access.canManageAllUnits || ["head", "assistant"].includes(access.rolesByUnit[unit.id] || ""),
          role: access.canViewAllUnits ? "admin" : access.rolesByUnit[unit.id] || null,
        },
      };
    }),
  });
}
