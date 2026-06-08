export type BuiltInAdminRole = "super_admin" | "pastor" | "assistant_pastor" | "secretary" | "media" | "follow_up" | "unit_leader";
export type AdminRole = BuiltInAdminRole | (string & {});

export type Permission =
  | "dashboard.view"
  | "members.view"
  | "members.manage"
  | "attendance.view"
  | "attendance.manage"
  | "followups.manage"
  | "units.view"
  | "units.manage"
  | "birthdays.manage"
  | "outreach.view"
  | "settings.manage"
  | "admins.manage";

export type PermissionDefinition = {
  key: Permission;
  label: string;
  description: string;
  group: "Dashboard" | "Members" | "Attendance" | "Units" | "Communication" | "Settings";
};

export type PageAccessDefinition = {
  key: string;
  label: string;
  path: string;
  description: string;
  group: "Personal" | "Operations" | "System";
  visibilityPermissions: Permission[];
  enablePermission: Permission;
};

export const permissionDefinitions: PermissionDefinition[] = [
  { key: "dashboard.view", label: "View Dashboard", description: "Access the workspace dashboard and overview metrics.", group: "Dashboard" },
  { key: "members.view", label: "View Members", description: "Open member directory and basic member records.", group: "Members" },
  { key: "members.manage", label: "Manage Members", description: "Create, edit, delete, import, and export member profiles.", group: "Members" },
  { key: "attendance.view", label: "View Attendance", description: "View attendance sessions, records, reports, and trends.", group: "Attendance" },
  { key: "attendance.manage", label: "Manage Attendance", description: "Create sessions and mark or update attendance records.", group: "Attendance" },
  { key: "followups.manage", label: "Manage Follow-Ups", description: "Manage absentee follow-up records and outcomes.", group: "Attendance" },
  { key: "units.view", label: "View Units", description: "Open unit management pages and unit rosters.", group: "Units" },
  { key: "units.manage", label: "Manage Units", description: "Create units, edit unit details, and manage unit membership.", group: "Units" },
  { key: "birthdays.manage", label: "Manage Birthdays", description: "Manage birthday messages and generated birthday designs.", group: "Communication" },
  { key: "outreach.view", label: "View Outreach", description: "View outreach-ready lists and communication workflows.", group: "Communication" },
  { key: "settings.manage", label: "Manage Settings", description: "Update church identity and system configuration.", group: "Settings" },
  { key: "admins.manage", label: "Manage Roles & Admins", description: "Assign admin profiles and configure role permissions.", group: "Settings" },
];

export const allPermissions = permissionDefinitions.map(permission => permission.key);

export const pageAccessDefinitions: PageAccessDefinition[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/",
    description: "Workspace overview, summaries, and operational metrics.",
    group: "Operations",
    visibilityPermissions: ["dashboard.view"],
    enablePermission: "dashboard.view",
  },
  {
    key: "members",
    label: "Member Directory",
    path: "/members",
    description: "Member listing, profile access, and basic congregation records.",
    group: "Operations",
    visibilityPermissions: ["members.view"],
    enablePermission: "members.view",
  },
  {
    key: "attendance",
    label: "Attendance",
    path: "/attendance",
    description: "Attendance sessions, reports, trends, and absentee follow-up entry points.",
    group: "Operations",
    visibilityPermissions: ["attendance.view"],
    enablePermission: "attendance.view",
  },
  {
    key: "units",
    label: "Unit Management",
    path: "/units",
    description: "Unit list, unit roster views, and unit workspace access.",
    group: "Operations",
    visibilityPermissions: ["units.view", "units.manage"],
    enablePermission: "units.view",
  },
  {
    key: "outreach",
    label: "Outreach",
    path: "/outreach",
    description: "WhatsApp-ready outreach lists and communication workflows.",
    group: "Operations",
    visibilityPermissions: ["outreach.view"],
    enablePermission: "outreach.view",
  },
  {
    key: "designs",
    label: "Birthday Management",
    path: "/designs",
    description: "Birthday templates, greeting messages, and generated celebration assets.",
    group: "Operations",
    visibilityPermissions: ["birthdays.manage"],
    enablePermission: "birthdays.manage",
  },
  {
    key: "settings",
    label: "Settings",
    path: "/settings",
    description: "Church identity, admin users, role permissions, and system configuration.",
    group: "System",
    visibilityPermissions: ["settings.manage", "admins.manage"],
    enablePermission: "settings.manage",
  },
];

export const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  pastor: "Pastor",
  assistant_pastor: "Assistant Pastor",
  secretary: "Secretary",
  media: "Media",
  follow_up: "Follow-Up",
  unit_leader: "Unit Leader",
};

export const roleDescriptions: Record<BuiltInAdminRole, string> = {
  super_admin: "Full system access for legacy super admin accounts and platform owners.",
  pastor: "Senior ministry oversight across members, units, attendance, outreach, and birthdays.",
  assistant_pastor: "Assistant ministry oversight with operational access across people, units, and attendance.",
  secretary: "Administrative data management for members, attendance, and units.",
  media: "Media and birthday communication support.",
  follow_up: "Attendance follow-up and outreach operations.",
  unit_leader: "Unit-facing access for HODs and assistants.",
};

export const rolePermissions: Record<BuiltInAdminRole, Permission[]> = {
  super_admin: [
    "dashboard.view",
    "members.view",
    "members.manage",
    "attendance.view",
    "attendance.manage",
    "followups.manage",
    "units.view",
    "units.manage",
    "birthdays.manage",
    "outreach.view",
    "settings.manage",
    "admins.manage",
  ],
  pastor: [
    "dashboard.view",
    "members.view",
    "attendance.view",
    "attendance.manage",
    "followups.manage",
    "units.view",
    "units.manage",
    "birthdays.manage",
    "outreach.view",
  ],
  assistant_pastor: [
    "dashboard.view",
    "members.view",
    "attendance.view",
    "attendance.manage",
    "followups.manage",
    "units.view",
    "units.manage",
    "outreach.view",
  ],
  secretary: ["dashboard.view", "members.view", "members.manage", "attendance.view", "attendance.manage", "units.view", "units.manage"],
  media: ["dashboard.view", "members.view", "birthdays.manage", "outreach.view"],
  follow_up: ["dashboard.view", "members.view", "attendance.view", "followups.manage", "outreach.view"],
  unit_leader: ["dashboard.view", "members.view", "attendance.view", "outreach.view", "units.view"],
};

export type RoleDefinition = {
  key: string;
  name: string;
  description: string | null;
  permissions: Permission[];
  is_system: boolean;
};

export const defaultRoleDefinitions: RoleDefinition[] = Object.entries(rolePermissions).map(([key, permissions]) => ({
  key,
  name: roleLabels[key] || key,
  description: roleDescriptions[key as BuiltInAdminRole] || null,
  permissions,
  is_system: true,
}));

export const getRoleLabel = (role: string) => roleLabels[role] || role.replace(/_/g, " ");
