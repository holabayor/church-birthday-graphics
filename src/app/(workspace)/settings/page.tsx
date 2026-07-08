"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { 
  Save, 
  Upload, 
  Church, 
  Image as ImageIcon, 
  MessageSquareCode, 
  Clock, 
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  AlertCircle,
  Loader2,
  Users,
  Eye
} from "lucide-react";
import { AdminProfile, ChurchSettings } from "@/lib/types";
import type { AdminRole } from "@/lib/adminRoles";
import { compressImage } from "@/lib/utils";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ADMIN_ACCOUNT_STATUS,
  ADMIN_ROLE,
  PERMISSION,
  adminAccountStatusOptions,
  getRoleLabel,
  pageAccessDefinitions,
  permissionDefinitions,
  roleLabels,
  type PageAccessDefinition,
  type Permission,
  type PermissionDefinition,
  type RoleDefinition,
} from "@/lib/adminRoles";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Omit<ChurchSettings, "id">>({
    church_name: "",
    church_address: "",
    logo_url: null,
    updated_at: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [adminSetupRequired, setAdminSetupRequired] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: "", full_name: "", role: ADMIN_ROLE.SECRETARY as AdminRole });
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editingAdmin, setEditingAdmin] = useState({ email: "", full_name: "", role: ADMIN_ROLE.SECRETARY as AdminRole, is_active: true });
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [rolePermissionDefinitions, setRolePermissionDefinitions] = useState<PermissionDefinition[]>(permissionDefinitions);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolesSetupRequired, setRolesSetupRequired] = useState(false);
  const [savingRoleKey, setSavingRoleKey] = useState<string | null>(null);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>(ADMIN_ROLE.PASTOR);
  const [newRole, setNewRole] = useState({ key: "", name: "", description: "" });
  const [savingNewRole, setSavingNewRole] = useState(false);

  useEffect(() => {
    // Fetch church settings
    fetch("/api/church-settings")
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(data);
        }
      });

    fetchAdmins();
    fetchRoles();
  }, []);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await fetch("/api/admins");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.data || []);
        setAdminSetupRequired(Boolean(data.setupRequired));
        if (data.setupRequired) {
          toast.error(data.error || "Admin role setup requires the latest database migration");
        }
      } else if (res.status !== 403) {
        const data = await res.json();
        toast.error(data.error || "Failed to load admins");
      }
    } catch (e) {
      console.error("Failed to fetch admins:", e);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        const nextRoles = data.data || [];
        setRoles(nextRoles);
        setSelectedRoleKey(current =>
          current && nextRoles.some((role: RoleDefinition) => role.key === current)
            ? current
            : nextRoles[0]?.key || ""
        );
        setRolePermissionDefinitions(data.permissions || permissionDefinitions);
        setRolesSetupRequired(Boolean(data.setupRequired));
        if (data.setupRequired) {
          toast.error(data.error || "Role permission setup requires the latest database migration");
        }
      } else if (res.status !== 403) {
        const data = await res.json();
        toast.error(data.error || "Failed to load role permissions");
      }
    } catch (e) {
      console.error("Failed to fetch roles:", e);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("bucket", "church-assets");
      formData.append("folder", "logos");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setSettings({ ...settings, logo_url: data.url });
        toast.success("Logo uploaded successfully");
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/church-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          church_name: settings?.church_name,
          church_address: settings?.church_address,
          logo_url: settings?.logo_url,
        }),
      });
      if (res.ok) {
        toast.success("Church settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.log("The error is ", error);
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.email.trim()) return;

    setSavingAdmin(true);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Admin added successfully");
        setNewAdmin({ email: "", full_name: "", role: ADMIN_ROLE.SECRETARY });
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to add admin");
      }
    } catch {
      toast.error("Failed to add admin");
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleUpdateAdmin = async (id: string) => {
    if (!editingAdmin.email.trim()) return;

    setSavingAdmin(true);
    try {
      const res = await fetch(`/api/admins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAdmin),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Admin updated successfully");
        setEditingAdminId(null);
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to update admin");
      }
    } catch {
      toast.error("Failed to update admin");
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Remove this admin profile? Their Supabase auth account will not be deleted.")) return;

    setSavingAdmin(true);
    try {
      const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Admin removed successfully");
        fetchAdmins();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove admin");
      }
    } catch {
      toast.error("Failed to remove admin");
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleToggleRolePermission = (roleKey: string, permission: Permission, checked: boolean) => {
    if (roleKey === ADMIN_ROLE.SUPER_ADMIN) return;

    setRoles(currentRoles =>
      currentRoles.map(role => {
        if (role.key !== roleKey) return role;
        const permissions = new Set(role.permissions);
        if (checked) permissions.add(permission);
        else permissions.delete(permission);
        return { ...role, permissions: Array.from(permissions) as Permission[] };
      })
    );
  };

  const handleTogglePageVisibility = (roleKey: string, page: PageAccessDefinition, checked: boolean) => {
    if (roleKey === ADMIN_ROLE.SUPER_ADMIN) return;

    setRoles(currentRoles =>
      currentRoles.map(role => {
        if (role.key !== roleKey) return role;
        const permissions = new Set(role.permissions);

        if (checked) {
          permissions.add(page.enablePermission);
        } else {
          page.visibilityPermissions.forEach(permission => permissions.delete(permission));
        }

        return { ...role, permissions: Array.from(permissions) as Permission[] };
      })
    );
  };

  const handleSaveRole = async (role: RoleDefinition) => {
    setSavingRoleKey(role.key);
    try {
      const res = await fetch("/api/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(role),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(`${role.name} permissions saved`);
        fetchRoles();
      } else {
        toast.error(data.error || "Failed to save role permissions");
      }
    } catch {
      toast.error("Failed to save role permissions");
    } finally {
      setSavingRoleKey(null);
    }
  };

  const handleCreateRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newRole.name.trim()) return;

    const key = newRole.key.trim() || newRole.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    setSavingNewRole(true);
    try {
      const res = await fetch("/api/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          name: newRole.name,
          description: newRole.description,
          permissions: [PERMISSION.DASHBOARD_VIEW],
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("Role created");
        setNewRole({ key: "", name: "", description: "" });
        fetchRoles();
      } else {
        toast.error(data.error || "Failed to create role");
      }
    } catch {
      toast.error("Failed to create role");
    } finally {
      setSavingNewRole(false);
    }
  };

  const roleOptions = roles.length
    ? roles
    : Object.entries(roleLabels).map(([key, name]) => ({ key, name, description: null, permissions: [], is_system: true }));
  const getRoleName = (roleKey: string) => roleOptions.find(role => role.key === roleKey)?.name || getRoleLabel(roleKey);
  const permissionsByGroup = rolePermissionDefinitions.reduce<Record<string, PermissionDefinition[]>>((groups, permission) => {
    groups[permission.group] = [...(groups[permission.group] || []), permission];
    return groups;
  }, {});
  const pagesByGroup = pageAccessDefinitions.reduce<Record<string, PageAccessDefinition[]>>((groups, page) => {
    groups[page.group] = [...(groups[page.group] || []), page];
    return groups;
  }, {});
  const selectedRole = roles.find(role => role.key === selectedRoleKey) || roles[0] || null;
  const settingsCardClass = "overflow-hidden border-[var(--outline-variant)] bg-white shadow-sm";
  const settingsCardHeaderClass = "gap-2 border-b border-[var(--outline-variant)] bg-white pb-5";
  const settingsCardTitleClass = "flex items-center gap-2 font-[var(--font-manrope)] text-xl text-[#0B1C30]";
  const settingsTabClass =
    "h-11 justify-start rounded-md border border-transparent px-3 text-sm font-medium text-[var(--on-surface-variant)] data-[state=active]:border-[var(--outline-variant)] data-[state=active]:bg-[var(--surface-container)] data-[state=active]:text-primary data-[state=active]:shadow-none";

  return (
    <div className="flex-1 w-full">
      <PageHeader
        eyebrow="System configuration"
        title="System Settings"
        description="Configure app identity, access, integrations, setup, and oversight controls."
      />

      <div className="w-full space-y-6 p-4 md:p-8">
        <Tabs defaultValue="general" className="w-full gap-6">
          <div className="overflow-x-auto rounded-xl border border-[var(--outline-variant)] bg-white p-2 shadow-sm">
            <TabsList className="grid h-auto w-max min-w-full grid-cols-[repeat(3,minmax(140px,1fr))] gap-1 bg-transparent p-0">
              <TabsTrigger value="general" className={settingsTabClass}>
                <Church className="h-4 w-4" />
                Core
              </TabsTrigger>
              <TabsTrigger value="access" className={settingsTabClass}>
                <Users className="h-4 w-4" />
                Access
              </TabsTrigger>
              <TabsTrigger value="integrations" className={settingsTabClass}>
                <MessageSquareCode className="h-4 w-4" />
                Integrations
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="mt-0 space-y-6">
        
        {/* Church Identity Settings */}
        <Card className={settingsCardClass}>
          <CardHeader className={settingsCardHeaderClass}>
            <CardTitle className={settingsCardTitleClass}>
              <Church className="h-5 w-5 text-primary" />
              Church Information
            </CardTitle>
            <CardDescription>
              This identity appears across member-facing and generated church materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium leading-none">Church Logo</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                  {settings?.logo_url ? (
                    <AvatarImage src={settings.logo_url} className="object-contain p-2" />
                  ) : (
                    <AvatarFallback className="bg-transparent">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : settings?.logo_url ? "Change Logo" : "Upload Logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG or JPG up to 2MB. Recommended dimensions: 200x200px.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium leading-none">
                  Church Name *
                </label>
                <Input
                  value={settings?.church_name}
                  onChange={e => setSettings({ ...settings, church_name: e.target.value })}
                  placeholder="e.g. Redeemed Christian Church of God"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium leading-none">
                  Church Address
                </label>
                <Input
                  value={settings?.church_address}
                  onChange={e => setSettings({ ...settings, church_address: e.target.value })}
                  placeholder="e.g. 15 Church Street, Lagos, Nigeria"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving Changes..." : "Save Church Info"}
              </Button>
            </div>
          </CardContent>
        </Card>

          </TabsContent>

          <TabsContent value="access" className="mt-0 space-y-6">
        {/* Admin Roles Card */}
        <Card className={settingsCardClass}>
          <CardHeader className={settingsCardHeaderClass}>
            <CardTitle className={settingsCardTitleClass}>
              <Users className="h-5 w-5 text-primary" />
              Admin Roles
            </CardTitle>
            <CardDescription>
              Grant app access by matching Supabase admin account emails to church roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAddAdmin} className="space-y-3">
              {adminSetupRequired && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Admin role management needs the latest Supabase migration. Run the admin_profiles setup SQL before adding admins.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px]">
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={newAdmin.email}
                  onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  disabled={savingAdmin}
                />
                <Input
                  placeholder="Full name"
                  value={newAdmin.full_name}
                  onChange={e => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                  disabled={savingAdmin}
                />
                <Select
                  value={newAdmin.role}
                  onValueChange={value => setNewAdmin({ ...newAdmin, role: value as AdminRole })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(role => (
                      <SelectItem key={role.key} value={role.key}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={savingAdmin || !newAdmin.email.trim()}>
                {savingAdmin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add Admin
              </Button>
            </form>

            <div className="space-y-4 pt-6 border-t">
              <h4 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider">
                Current Admins ({admins.length})
              </h4>

              {loadingAdmins ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No admin profiles configured yet. Existing authenticated admins without a profile are treated as super admins.
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map(admin => {
                    const isEditing = editingAdminId === admin.id;
                    return (
                      <div key={admin.id} className="flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 space-y-2">
                          {isEditing ? (
                            <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px_140px]">
                              <Input
                                type="email"
                                value={editingAdmin.email}
                                onChange={e => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                                className="bg-white"
                              />
                              <Input
                                value={editingAdmin.full_name}
                                onChange={e => setEditingAdmin({ ...editingAdmin, full_name: e.target.value })}
                                placeholder="Full name"
                                className="bg-white"
                              />
                              <Select
                                value={editingAdmin.role}
                                onValueChange={value => setEditingAdmin({ ...editingAdmin, role: value as AdminRole })}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleOptions.map(role => (
                                    <SelectItem key={role.key} value={role.key}>{role.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={editingAdmin.is_active ? ADMIN_ACCOUNT_STATUS.ACTIVE : ADMIN_ACCOUNT_STATUS.INACTIVE}
                                onValueChange={value => setEditingAdmin({ ...editingAdmin, is_active: value === ADMIN_ACCOUNT_STATUS.ACTIVE })}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {adminAccountStatusOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-zinc-900">{admin.full_name || admin.email}</p>
                                <Badge variant="secondary">{getRoleName(admin.role)}</Badge>
                                {!admin.is_active && <Badge variant="destructive">Inactive</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{admin.email}</p>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-zinc-200 text-zinc-700 bg-white shadow-xs"
                                onClick={() => handleUpdateAdmin(admin.id)}
                                disabled={savingAdmin || !editingAdmin.email.trim()}
                              >
                                <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-zinc-500 hover:text-zinc-900"
                                onClick={() => setEditingAdminId(null)}
                                disabled={savingAdmin}
                              >
                                <X className="h-3.5 w-3.5 mr-1.5" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                onClick={() => {
                                  setEditingAdminId(admin.id);
                                  setEditingAdmin({
                                    email: admin.email,
                                    full_name: admin.full_name || "",
                                    role: admin.role as AdminRole,
                                    is_active: admin.is_active,
                                  });
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-zinc-500 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => handleDeleteAdmin(admin.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Page Visibility Card */}
        <Card className={settingsCardClass}>
          <CardHeader className={settingsCardHeaderClass}>
            <CardTitle className={settingsCardTitleClass}>
              <Eye className="h-5 w-5 text-primary" />
              Visibility & Access Control
            </CardTitle>
            <CardDescription>
              Choose the workspace pages each role can see. Action-level permissions remain available in the role permissions section below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingRoles ? (
              <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
                <Skeleton className="h-72 w-full rounded-xl" />
                <Skeleton className="h-72 w-full rounded-xl" />
              </div>
            ) : roles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-muted-foreground">
                No roles available yet.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
                <div className="rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-3">
                  <p className="mb-3 font-mono text-[12px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                    User Types
                  </p>
                  <div className="space-y-2">
                    {roles.map(role => {
                      const visiblePages = pageAccessDefinitions.filter(page =>
                        page.visibilityPermissions.some(permission => role.permissions.includes(permission))
                      ).length;

                      return (
                        <button
                          key={role.key}
                          type="button"
                          onClick={() => setSelectedRoleKey(role.key)}
                          className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                            selectedRole?.key === role.key
                              ? "border-primary/20 bg-white text-primary shadow-sm"
                              : "border-transparent text-[#0B1C30] hover:border-[var(--outline-variant)] hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-zinc-950">{role.name}</span>
                            {role.is_system ? <Badge variant="secondary">System</Badge> : null}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {visiblePages} pages visible
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedRole ? (
                  <div className="rounded-lg border border-[var(--outline-variant)] bg-white">
                    <div className="flex flex-col gap-3 border-b border-[var(--outline-variant)] px-4 py-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-zinc-950">{selectedRole.name}</h4>
                          {selectedRole.key === ADMIN_ROLE.SUPER_ADMIN ? (
                            <Badge className="bg-primary text-primary-foreground hover:bg-primary">Always visible</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                          These switches control the sidebar and protected page access for this role.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveRole(selectedRole)}
                        disabled={rolesSetupRequired || selectedRole.key === ADMIN_ROLE.SUPER_ADMIN || savingRoleKey === selectedRole.key}
                        className="self-start"
                      >
                        {savingRoleKey === selectedRole.key ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Visibility
                      </Button>
                    </div>

                    <div className="grid gap-0 divide-y divide-[var(--outline-variant)] xl:grid-cols-2 xl:divide-x xl:divide-y-0">
                      {Object.entries(pagesByGroup).map(([group, pages]) => (
                        <div key={group} className="p-4">
                          <p className="mb-3 font-mono text-[12px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                            {group}
                          </p>
                          <div className="space-y-3">
                            {pages.map(page => {
                              const visible = page.visibilityPermissions.some(permission =>
                                selectedRole.permissions.includes(permission)
                              );

                              return (
                                <label
                                  key={page.key}
                                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-[var(--outline-variant)] hover:bg-[var(--surface-container-low)]"
                                >
                                  <Checkbox
                                    checked={visible}
                                    disabled={rolesSetupRequired || selectedRole.key === ADMIN_ROLE.SUPER_ADMIN}
                                    onCheckedChange={value =>
                                      handleTogglePageVisibility(selectedRole.key, page, Boolean(value))
                                    }
                                    className="mt-1"
                                  />
                                  <span className="grid flex-1 gap-1">
                                    <span className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-medium text-zinc-950">{page.label}</span>
                                      <Badge variant="outline" className="font-mono text-[11px]">
                                        {page.path}
                                      </Badge>
                                      {visible ? (
                                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 shadow-none">
                                          Visible
                                        </Badge>
                                      ) : null}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{page.description}</span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Permissions Card */}
        <Card className={settingsCardClass}>
          <CardHeader className={settingsCardHeaderClass}>
            <CardTitle className={settingsCardTitleClass}>
              <Users className="h-5 w-5 text-primary" />
              Role Permissions
            </CardTitle>
            <CardDescription>
              Control what each church role can see and do across the workspace. These permissions drive sidebar links, pages, APIs, and detail visibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {rolesSetupRequired && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Role permissions are showing default values until the app_roles and app_role_permissions migration is applied.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreateRole} className="rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4">
              <div className="mb-3">
                <h4 className="font-semibold text-zinc-950">Create Custom Role</h4>
                <p className="text-sm text-muted-foreground">
                  Create a role first, then choose its permissions below.
                </p>
              </div>
              <div className="grid gap-3 lg:grid-cols-[180px_1fr_minmax(220px,1fr)_auto]">
                <Input
                  placeholder="role_key"
                  value={newRole.key}
                  onChange={event => setNewRole({ ...newRole, key: event.target.value })}
                  disabled={rolesSetupRequired || savingNewRole}
                />
                <Input
                  placeholder="Role name"
                  value={newRole.name}
                  onChange={event => setNewRole({ ...newRole, name: event.target.value })}
                  disabled={rolesSetupRequired || savingNewRole}
                />
                <Input
                  placeholder="Description"
                  value={newRole.description}
                  onChange={event => setNewRole({ ...newRole, description: event.target.value })}
                  disabled={rolesSetupRequired || savingNewRole}
                />
                <Button type="submit" disabled={rolesSetupRequired || savingNewRole || !newRole.name.trim()}>
                  {savingNewRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Create
                </Button>
              </div>
            </form>

            {loadingRoles ? (
              <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
                <Skeleton className="h-80 w-full rounded-xl" />
                <Skeleton className="h-80 w-full rounded-xl" />
              </div>
            ) : roles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-muted-foreground">
                No roles available yet.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
                <div className="rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-3">
                  <p className="mb-3 font-mono text-[12px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                    Roles
                  </p>
                  <div className="space-y-2">
                    {roles.map(role => (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => setSelectedRoleKey(role.key)}
                        className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                          selectedRole?.key === role.key
                            ? "border-primary/20 bg-white text-primary shadow-sm"
                            : "border-transparent text-[#0B1C30] hover:border-[var(--outline-variant)] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-zinc-950">{role.name}</span>
                          {role.is_system ? <Badge variant="secondary">System</Badge> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {role.permissions.length} permissions enabled
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedRole ? (
                  <div className="rounded-lg border border-[var(--outline-variant)] bg-white">
                    <div className="flex flex-col gap-3 border-b border-[var(--outline-variant)] px-4 py-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-zinc-950">{selectedRole.name}</h4>
                          {selectedRole.is_system ? <Badge variant="secondary">System role</Badge> : null}
                        </div>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                          {selectedRole.description || "Custom role permissions."}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveRole(selectedRole)}
                        disabled={rolesSetupRequired || selectedRole.key === ADMIN_ROLE.SUPER_ADMIN || savingRoleKey === selectedRole.key}
                        className="self-start"
                      >
                        {savingRoleKey === selectedRole.key ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Role
                      </Button>
                    </div>

                    <div className="grid gap-0 divide-y divide-[var(--outline-variant)] xl:grid-cols-2 xl:divide-x xl:divide-y-0">
                      {Object.entries(permissionsByGroup).map(([group, permissions]) => (
                        <div key={group} className="p-4">
                          <p className="mb-3 font-mono text-[12px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                            {group}
                          </p>
                          <div className="space-y-3">
                            {permissions.map(permission => {
                              const checked = selectedRole.permissions.includes(permission.key);
                              return (
                                <label key={permission.key} className="flex cursor-pointer items-start gap-3">
                                  <Checkbox
                                    checked={checked}
                                    disabled={rolesSetupRequired || selectedRole.key === ADMIN_ROLE.SUPER_ADMIN}
                                    onCheckedChange={value =>
                                      handleToggleRolePermission(selectedRole.key, permission.key, Boolean(value))
                                    }
                                    className="mt-0.5"
                                  />
                                  <span className="grid gap-0.5">
                                    <span className="text-sm font-medium text-zinc-950">{permission.label}</span>
                                    <span className="text-xs text-muted-foreground">{permission.description}</span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

          </TabsContent>

          <TabsContent value="integrations" className="mt-0 space-y-6">
        {/* WhatsApp Integration Info */}
        <Card className={settingsCardClass}>
          <CardHeader className={settingsCardHeaderClass}>
            <CardTitle className={settingsCardTitleClass}>
              <MessageSquareCode className="h-5 w-5 text-primary" />
              WhatsApp Integration
            </CardTitle>
            <CardDescription>
              To enable automatic WhatsApp sending, set up the following environment variables on your server infrastructure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-background rounded-lg p-4 border font-mono text-sm text-muted-foreground">
              <div className="flex flex-col gap-1.5">
                <div><span className="text-primary font-medium">WHATSAPP_TOKEN</span>=your_whatsapp_cloud_api_token</div>
                <div><span className="text-primary font-medium">WHATSAPP_PHONE_ID</span>=your_phone_number_id</div>
                <div><span className="text-primary font-medium">WHATSAPP_GROUP_ID</span>=recipient_phone_or_group_id</div>
                <div><span className="text-primary font-medium">CRON_SECRET</span>=a_secret_for_cron_auth</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Get these credentials from the Meta Business / WhatsApp Cloud API dashboard at <a href="https://developers.facebook.com" className="underline hover:text-primary" target="_blank" rel="noreferrer">developers.facebook.com</a>.
            </p>
          </CardContent>
        </Card>

        {/* Cron Job Info */}
        <Card className={settingsCardClass}>
          <CardHeader className={settingsCardHeaderClass}>
            <CardTitle className={settingsCardTitleClass}>
              <Clock className="h-5 w-5 text-muted-foreground" />
              Cron Job Automation
            </CardTitle>
            <CardDescription>
              Set up a daily cron job to automatically check for birthdays and dispatch graphics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 border font-mono text-sm text-muted-foreground space-y-1">
              <div><span className="text-amber-600 dark:text-amber-400 font-bold">POST</span> /api/birthdays/send</div>
              <div><span className="text-primary font-semibold">Authorization</span>: Bearer YOUR_CRON_SECRET</div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              If deploying on Vercel, add a <code className="bg-muted px-1 rounded">vercel.json</code> with cron configuration. Otherwise, use any standard cron service (e.g., cron-job.org).
            </p>
          </CardContent>
        </Card>

          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
