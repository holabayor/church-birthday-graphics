import { cookies } from "next/headers";
import { createClient } from "@/lib/server";
import { AdminRole, Permission, rolePermissions } from "@/lib/adminRoles";

export interface AdminContext {
  email: string;
  role: AdminRole;
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
  role: "super_admin",
  permissions: rolePermissions.super_admin,
});

export async function getAdminContext(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<AdminContext | null> {
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: profile, error } = await supabase
    .from("admin_profiles")
    .select("email, full_name, role, is_active")
    .eq("email", user.email)
    .maybeSingle();

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("Failed to load admin profile; falling back to super admin:", error);
    }
    return fallbackSuperAdmin(user.email);
  }

  if (!profile) return fallbackSuperAdmin(user.email);

  if (profile.is_active === false) return null;

  const role = (profile.role || "secretary") as AdminRole;
  return {
    email: profile.email,
    name: profile.full_name || null,
    role,
    permissions: rolePermissions[role] || rolePermissions.secretary,
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
