import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/server";
import { canManageUnitMembers, getUnitAccess } from "@/lib/unitAccess";
import { cacheKeys, invalidateCache } from "@/lib/serverCache";
import { normalizeUnitRole, UNIT_ROLE, unitRoleOptions } from "@/lib/unitRoles";

const validRoles = new Set(unitRoleOptions.map(option => option.value));

function invalidateUnitCaches(unitId: string) {
  invalidateCache(cacheKeys.units);
  invalidateCache(cacheKeys.unitsManagement);
  invalidateCache(cacheKeys.unit(unitId));
}

async function requireUnitMemberAccess(unitId: string) {
  const cookieStore = await cookies();
  const access = await getUnitAccess(cookieStore);
  return {
    cookieStore,
    allowed: canManageUnitMembers(access, unitId),
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: unitId } = await params;
  const { cookieStore, allowed } = await requireUnitMemberAccess(unitId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { member_id, phone_number, role = UNIT_ROLE.MEMBER } = await req.json();
  if (!validRoles.has(role)) return NextResponse.json({ error: "Invalid unit role" }, { status: 400 });
  if (!member_id && !phone_number?.trim()) {
    return NextResponse.json({ error: "Member ID or phone number is required" }, { status: 400 });
  }

  const supabase = createClient(cookieStore);
  let resolvedMemberId = member_id;

  if (!resolvedMemberId) {
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id")
      .eq("phone_number", phone_number.trim())
      .maybeSingle();

    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });
    if (!member) return NextResponse.json({ error: "No member found with that phone number" }, { status: 404 });
    resolvedMemberId = member.id;
  }

  const { error } = await supabase
    .from("church_unit_members")
    .upsert({ unit_id: unitId, member_id: resolvedMemberId, role: normalizeUnitRole(role) });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateUnitCaches(unitId);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: unitId } = await params;
  const { cookieStore, allowed } = await requireUnitMemberAccess(unitId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { member_id, role } = await req.json();
  if (!member_id || !validRoles.has(role)) {
    return NextResponse.json({ error: "Member ID and valid role are required" }, { status: 400 });
  }

  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("church_unit_members")
    .update({ role: normalizeUnitRole(role) })
    .eq("unit_id", unitId)
    .eq("member_id", member_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateUnitCaches(unitId);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: unitId } = await params;
  const { cookieStore, allowed } = await requireUnitMemberAccess(unitId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const memberId = req.nextUrl.searchParams.get("member_id");
  if (!memberId) return NextResponse.json({ error: "Member ID is required" }, { status: 400 });

  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("church_unit_members")
    .delete()
    .eq("unit_id", unitId)
    .eq("member_id", memberId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateUnitCaches(unitId);
  return NextResponse.json({ success: true });
}
