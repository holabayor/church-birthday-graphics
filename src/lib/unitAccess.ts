import { cookies } from "next/headers";
import { createClient } from "@/lib/server";
import { getAdminContext, hasPermission } from "@/lib/adminPermissions";

export type UnitAccessRole = "admin" | "head" | "assistant";

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
  const canManageAllUnits = hasPermission(adminContext, "units.manage");
  const canViewAllUnits = canManageAllUnits || hasPermission(adminContext, "units.view");
  const rolesByUnit: Record<string, UnitAccessRole> = {};

  if (canViewAllUnits) {
    rolesByUnit.__all = "admin";
  }

  if (memberId) {
    const { data } = await supabase
      .from("church_unit_members")
      .select("unit_id, role")
      .eq("member_id", memberId)
      .in("role", ["head", "assistant"]);

    for (const row of data || []) {
      rolesByUnit[row.unit_id] = row.role === "head" ? "head" : "assistant";
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
  context.canManageAllUnits || context.rolesByUnit[unitId] === "head" || context.rolesByUnit[unitId] === "assistant";
