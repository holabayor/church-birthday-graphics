import { cookies } from "next/headers";
import { createClient } from "@/lib/server";
import { ADMIN_ROLE, type Permission, rolePermissions } from "@/lib/adminRoles";
import { cacheKeys, getCached } from "@/lib/serverCache";

export interface AdminContext {
  email: string;
  role: string;
  permissions: Permission[];
  name: string | null;
}

export const hasPermission = (context: AdminContext | null, permission: Permission) =>
  Boolean(context?.permissions.includes(permission));

export const isMissingTableError = (error: { code?: string; message?: string } | null | undefined) =>
  error?.code === "PGRST205" ||
  error?.code === "42P01" ||
  Boolean(error?.message?.toLowerCase().includes("could not find the table"));

const fallbackSuperAdmin = (email: string, name: string | null = null): AdminContext => ({
  email,
  name,
  role: ADMIN_ROLE.SUPER_ADMIN,
  permissions: rolePermissions[ADMIN_ROLE.SUPER_ADMIN],
});

export async function getPermissionsForRole(
  supabase: ReturnType<typeof createClient>,
  role: string | null | undefined
): Promise<Permission[]> {
  if (!role) return [];
  if (role === ADMIN_ROLE.SUPER_ADMIN) return rolePermissions[ADMIN_ROLE.SUPER_ADMIN];

  const { value } = await getCached(cacheKeys.rolePermissions(role), 120, async () => {
    const fallback = rolePermissions[role as keyof typeof rolePermissions] || [];
    const { data, error } = await supabase
      .from("app_role_permissions")
      .select("permission")
      .eq("role_key", role);

    if (error) {
      if (!isMissingTableError(error)) {
        console.error("Failed to load role permissions; falling back to defaults:", error);
      }
      return fallback;
    }

    if (!data || data.length === 0) return fallback;
    return data.map(row => row.permission).filter(Boolean) as Permission[];
  });

  return value;
}

export async function getAdminContext(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<AdminContext | null> {
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let email = user?.email || null;

  if (!email) {
    const memberId = cookieStore.get("member_id")?.value;
    if (memberId) {
      const { data: member } = await supabase
        .from("members")
        .select("email")
        .eq("id", memberId)
        .maybeSingle();

      email = member?.email || null;
    }
  }

  if (!email) return null;

  const { data: profile, error } = await supabase
    .from("admin_profiles")
    .select("email, full_name, role, is_active")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Failed to load admin profile; falling back to super admin:", error);
    }
    return user?.email ? fallbackSuperAdmin(user.email) : null;
  }

  if (!profile) return user?.email ? fallbackSuperAdmin(user.email) : null;

  if (profile.is_active === false) return null;

  const role = profile.role || ADMIN_ROLE.SECRETARY;
  return {
    email: profile.email,
    name: profile.full_name || null,
    role,
    permissions: await getPermissionsForRole(supabase, role),
  };
}

export async function requirePermission(permission: Permission) {
  const cookieStore = await cookies();
  const context = await getAdminContext(cookieStore);
  return {
    context,
    allowed: hasPermission(context, permission),
  };
}
