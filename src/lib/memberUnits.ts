export type UnitRole = "member" | "assistant" | "head";

export async function attachMemberUnits(supabase: any, members: any[]) {
  const ids = members.map(member => member.id).filter(Boolean);
  if (ids.length === 0) return members;

  const { data, error } = await supabase
    .from("church_unit_members")
    .select("member_id, role, church_units(id, name, description)")
    .in("member_id", ids);

  if (error) {
    console.error("Failed to load member units:", error);
    return members;
  }

  const unitsByMember = new Map<string, any[]>();

  for (const row of data || []) {
    const unit = Array.isArray(row.church_units) ? row.church_units[0] : row.church_units;
    if (!unit) continue;

    const assignments = unitsByMember.get(row.member_id) || [];
    assignments.push({
      id: unit.id,
      name: unit.name,
      description: unit.description,
      role: row.role || "member",
    });
    unitsByMember.set(row.member_id, assignments);
  }

  return members.map(member => ({
    ...member,
    units: unitsByMember.get(member.id) || [],
  }));
}

export async function saveMemberUnits(
  supabase: any,
  memberId: string,
  units: Array<{ unit_id: string; role: UnitRole }>
) {
  const { error: deleteError } = await supabase
    .from("church_unit_members")
    .delete()
    .eq("member_id", memberId);

  if (deleteError) return deleteError;

  const rows = units
    .filter(unit => unit.unit_id && unit.role)
    .map(unit => ({
      member_id: memberId,
      unit_id: unit.unit_id,
      role: unit.role,
    }));

  if (rows.length === 0) return null;

  const { error } = await supabase.from("church_unit_members").insert(rows);
  return error || null;
}
