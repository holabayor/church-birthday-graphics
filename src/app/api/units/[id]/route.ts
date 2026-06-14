import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { canAccessUnit, canManageUnitMembers, getUnitAccess } from "@/lib/unitAccess";
import { cacheKeys, getCached, invalidateCache } from "@/lib/serverCache";
import { UNIT_ROLE } from "@/lib/unitRoles";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const access = await getUnitAccess(cookieStore);

  if (!canAccessUnit(access, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const accessKey = [
    access.canViewAllUnits ? "all" : "scoped",
    access.canManageAllUnits ? "manage-all" : "scoped",
    access.rolesByUnit[id] || "none",
  ].join("|");

  try {
    const { hit, value } = await getCached(`${cacheKeys.unit(id)}:${accessKey}`, 60, async () => {
      const supabase = createClient(cookieStore);

      const { data: unit, error: unitError } = await supabase
        .from("church_units")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (unitError) throw new Error(unitError.message);
      if (!unit) return null;

      const { data: memberRows, error: membersError } = await supabase
        .from("church_unit_members")
        .select("unit_id, role, created_at, members(id, first_name, middle_name, last_name, phone_number, email, life_stage, membership_status, photo_url, is_active)")
        .eq("unit_id", id);

      if (membersError) throw new Error(membersError.message);

      const members = (memberRows || [])
        .map(row => {
          const member = Array.isArray(row.members) ? row.members[0] : row.members;
          if (!member) return null;

          return {
            ...member,
            unit_role: row.role || UNIT_ROLE.MEMBER,
            joined_at: row.created_at,
          };
        })
        .filter(Boolean);

      const leaders = members.filter(member => member?.unit_role === UNIT_ROLE.HEAD);
      const assistants = members.filter(member => member?.unit_role === UNIT_ROLE.ASSISTANT);

      return {
        data: {
          ...unit,
          members,
          stats: {
            total_members: members.length,
            heads: leaders.length,
            assistants: assistants.length,
          },
          access: {
            can_manage_details: access.canManageAllUnits,
            can_manage_members: canManageUnitMembers(access, id),
            role: access.canViewAllUnits ? "admin" : access.rolesByUnit[id] || null,
          },
        },
      };
    });

    if (!value) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    return NextResponse.json(value, { headers: { "X-App-Cache": hit ? "HIT" : "MISS" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission(PERMISSION.UNITS_MANAGE);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, description } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Unit name is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("church_units")
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateCache(cacheKeys.units);
  invalidateCache(cacheKeys.unitsManagement);
  invalidateCache(cacheKeys.unit(id));
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission(PERMISSION.UNITS_MANAGE);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("church_units").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateCache(cacheKeys.units);
  invalidateCache(cacheKeys.unitsManagement);
  invalidateCache(cacheKeys.unit(id));
  return NextResponse.json({ success: true });
}
