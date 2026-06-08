import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { isMissingTableError, requirePermission } from "@/lib/adminPermissions";
import { createClient } from "@/lib/server";
import {
  Permission,
  defaultRoleDefinitions,
  permissionDefinitions,
  roleDescriptions,
  roleLabels,
  rolePermissions,
} from "@/lib/adminRoles";

const missingRolesTableMessage =
  "Database migration required. Run the latest SUPABASE_SETUP.md role-permission migration so app_roles and app_role_permissions exist.";

const validPermissions = new Set(permissionDefinitions.map(permission => permission.key));

function fallbackRoles() {
  return defaultRoleDefinitions;
}

export async function GET() {
  const { allowed } = await requirePermission("admins.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: roles, error: rolesError } = await supabase
    .from("app_roles")
    .select("key, name, description, is_system")
    .order("is_system", { ascending: false })
    .order("name", { ascending: true });

  if (rolesError) {
    if (isMissingTableError(rolesError)) {
      return NextResponse.json({
        data: fallbackRoles(),
        permissions: permissionDefinitions,
        setupRequired: true,
        error: missingRolesTableMessage,
      });
    }
    return NextResponse.json({ error: rolesError.message }, { status: 500 });
  }

  const { data: permissionRows, error: permissionsError } = await supabase
    .from("app_role_permissions")
    .select("role_key, permission");

  if (permissionsError) {
    if (isMissingTableError(permissionsError)) {
      return NextResponse.json({
        data: fallbackRoles(),
        permissions: permissionDefinitions,
        setupRequired: true,
        error: missingRolesTableMessage,
      });
    }
    return NextResponse.json({ error: permissionsError.message }, { status: 500 });
  }

  const permissionsByRole = new Map<string, Permission[]>();
  for (const row of permissionRows || []) {
    const permissions = permissionsByRole.get(row.role_key) || [];
    permissions.push(row.permission as Permission);
    permissionsByRole.set(row.role_key, permissions);
  }

  const data = (roles || []).map(role => ({
    key: role.key,
    name: role.name || roleLabels[role.key] || role.key,
    description: role.description || roleDescriptions[role.key as keyof typeof roleDescriptions] || null,
    is_system: role.is_system !== false,
    permissions: permissionsByRole.get(role.key) || rolePermissions[role.key as keyof typeof rolePermissions] || [],
  }));

  return NextResponse.json({ data, permissions: permissionDefinitions, setupRequired: false });
}

export async function PUT(req: NextRequest) {
  const { allowed } = await requirePermission("admins.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key, name, description, permissions } = await req.json();
  if (!key?.trim() || !name?.trim() || !Array.isArray(permissions)) {
    return NextResponse.json({ error: "Role key, name, and permissions are required" }, { status: 400 });
  }

  const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const cleanPermissions = Array.from(new Set(permissions)).filter(permission =>
    validPermissions.has(permission as Permission)
  ) as Permission[];

  if (cleanKey === "super_admin" && cleanPermissions.length !== validPermissions.size) {
    return NextResponse.json({ error: "Super admin must retain all permissions" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error: roleError } = await supabase
    .from("app_roles")
    .upsert({
      key: cleanKey,
      name: name.trim(),
      description: description?.trim() || null,
      is_system: Boolean(rolePermissions[cleanKey as keyof typeof rolePermissions]),
      updated_at: new Date().toISOString(),
    });

  if (roleError) {
    if (isMissingTableError(roleError)) {
      return NextResponse.json({ error: missingRolesTableMessage, setupRequired: true }, { status: 400 });
    }
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("app_role_permissions")
    .delete()
    .eq("role_key", cleanKey);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (cleanPermissions.length > 0) {
    const { error: insertError } = await supabase
      .from("app_role_permissions")
      .insert(cleanPermissions.map(permission => ({ role_key: cleanKey, permission })));

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
