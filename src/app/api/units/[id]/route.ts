import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { canAccessUnit, canManageUnitMembers, getUnitAccess } from "@/lib/unitAccess";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const access = await getUnitAccess(cookieStore);

  if (!canAccessUnit(access, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createClient(cookieStore);

  const { data: unit, error: unitError } = await supabase
    .from("church_units")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (unitError) return NextResponse.json({ error: unitError.message }, { status: 500 });
  if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

  const { data: memberRows, error: membersError } = await supabase
    .from("church_unit_members")
    .select("unit_id, role, created_at, members(id, first_name, middle_name, last_name, phone_number, email, member_type, photo_url, is_active)")
    .eq("unit_id", id);

  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

  const members = (memberRows || [])
    .map(row => {
      const member = Array.isArray(row.members) ? row.members[0] : row.members;
      if (!member) return null;

      return {
        ...member,
        unit_role: row.role || "member",
        joined_at: row.created_at,
      };
    })
    .filter(Boolean);

  const leaders = members.filter(member => member?.unit_role === "head");
  const assistants = members.filter(member => member?.unit_role === "assistant");

  return NextResponse.json({
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
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission("units.manage");
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
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission("units.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("church_units").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
