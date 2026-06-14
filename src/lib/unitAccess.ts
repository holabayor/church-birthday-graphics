import { cookies } from "next/headers";
import { createClient } from "@/lib/server";
import { getAdminContext, hasPermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { UNIT_ROLE, type UnitLeadershipRole } from "@/lib/unitRoles";

export type UnitAccessRole = "admin" | UnitLeadershipRole;

export interface UnitAccessContext {
  memberId: string | null;
  canViewAllUnits: boolean;
  canManageAllUnits: boolean;
  manageableUnitIds: string[];
  rolesByUnit: Record<string, UnitAccessRole>;
}

export async function getUnitAccess(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<UnitAccessContext> {
  const supabase = createClient(cookieStore);
  const adminContext = await getAdminContext(cookieStore);
  const memberId = cookieStore.get("member_id")?.value || null;
  const canManageAllUnits = hasPermission(adminContext, PERMISSION.UNITS_MANAGE);
  const canViewAllUnits = canManageAllUnits || hasPermission(adminContext, PERMISSION.UNITS_VIEW);
  const rolesByUnit: Record<string, UnitAccessRole> = {};

  if (canViewAllUnits) {
    rolesByUnit.__all = "admin";
  }

  if (memberId) {
    const { data } = await supabase
      .from("church_unit_members")
      .select("unit_id, role")
      .eq("member_id", memberId)
      .in("role", [UNIT_ROLE.HEAD, UNIT_ROLE.ASSISTANT]);

    for (const row of data || []) {
      rolesByUnit[row.unit_id] = row.role === UNIT_ROLE.HEAD ? UNIT_ROLE.HEAD : UNIT_ROLE.ASSISTANT;
    }
  }

  return {
    memberId,
    canViewAllUnits,
    canManageAllUnits,
    manageableUnitIds: Object.keys(rolesByUnit).filter(unitId => unitId !== "__all"),
    rolesByUnit,
  };
}

export const canAccessUnit = (context: UnitAccessContext, unitId: string) =>
  context.canViewAllUnits || Boolean(context.rolesByUnit[unitId]);

export const canManageUnitMembers = (context: UnitAccessContext, unitId: string) =>
  context.canManageAllUnits ||
  context.rolesByUnit[unitId] === UNIT_ROLE.HEAD ||
  context.rolesByUnit[unitId] === UNIT_ROLE.ASSISTANT;
