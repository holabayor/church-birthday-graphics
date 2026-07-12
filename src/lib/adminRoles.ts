export const ADMIN_ROLE = {
  SUPER_ADMIN: "super_admin",
  PASTOR: "pastor",
  ASSISTANT_PASTOR: "assistant_pastor",
  SECRETARY: "secretary",
  MEDIA: "media",
  FOLLOW_UP: "follow_up",
  UNIT_LEADER: "unit_leader",
} as const;

export const ADMIN_ACCOUNT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type BuiltInAdminRole = (typeof ADMIN_ROLE)[keyof typeof ADMIN_ROLE];
export type AdminRole = BuiltInAdminRole | (string & {});
export type AdminAccountStatus = (typeof ADMIN_ACCOUNT_STATUS)[keyof typeof ADMIN_ACCOUNT_STATUS];

export const adminAccountStatusOptions = [
  { value: ADMIN_ACCOUNT_STATUS.ACTIVE, label: "Active" },
  { value: ADMIN_ACCOUNT_STATUS.INACTIVE, label: "Inactive" },
] as const;

export const fullMemberDetailRoles: BuiltInAdminRole[] = [
  ADMIN_ROLE.SUPER_ADMIN,
  ADMIN_ROLE.PASTOR,
  ADMIN_ROLE.ASSISTANT_PASTOR,
];

export const PERMISSION = {
  DASHBOARD_VIEW: "dashboard.view",
  MEMBERS_VIEW: "members.view",
  MEMBERS_MANAGE: "members.manage",
  ATTENDANCE_VIEW: "attendance.view",
  ATTENDANCE_MANAGE: "attendance.manage",
  FOLLOWUPS_MANAGE: "followups.manage",
  UNITS_VIEW: "units.view",
  UNITS_MANAGE: "units.manage",
  BIRTHDAYS_MANAGE: "birthdays.manage",
  OUTREACH_VIEW: "outreach.view",
  SETTINGS_MANAGE: "settings.manage",
  ADMINS_MANAGE: "admins.manage",
  POLLS_MANAGE: "polls.manage",
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

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
  { key: PERMISSION.DASHBOARD_VIEW, label: "View Dashboard", description: "Access the workspace dashboard and overview metrics.", group: "Dashboard" },
  { key: PERMISSION.MEMBERS_VIEW, label: "View Members", description: "Open member directory and basic member records.", group: "Members" },
  { key: PERMISSION.MEMBERS_MANAGE, label: "Manage Members", description: "Create, edit, delete, import, and export member profiles.", group: "Members" },
  { key: PERMISSION.ATTENDANCE_VIEW, label: "View Attendance", description: "View attendance sessions, records, reports, and trends.", group: "Attendance" },
  { key: PERMISSION.ATTENDANCE_MANAGE, label: "Manage Attendance", description: "Create sessions and mark or update attendance records.", group: "Attendance" },
  { key: PERMISSION.FOLLOWUPS_MANAGE, label: "Manage Follow-Ups", description: "Manage absentee follow-up records and outcomes.", group: "Attendance" },
  { key: PERMISSION.UNITS_VIEW, label: "View Units", description: "Open unit management pages and unit rosters.", group: "Units" },
  { key: PERMISSION.UNITS_MANAGE, label: "Manage Units", description: "Create units, edit unit details, and manage unit membership.", group: "Units" },
  { key: PERMISSION.BIRTHDAYS_MANAGE, label: "Manage Birthdays", description: "Manage birthday messages and generated birthday designs.", group: "Communication" },
  { key: PERMISSION.OUTREACH_VIEW, label: "View Outreach", description: "View outreach-ready lists and communication workflows.", group: "Communication" },
  { key: PERMISSION.SETTINGS_MANAGE, label: "Manage Settings", description: "Update church identity and system configuration.", group: "Settings" },
  { key: PERMISSION.ADMINS_MANAGE, label: "Manage Roles & Admins", description: "Assign admin profiles and configure role permissions.", group: "Settings" },
  { key: PERMISSION.POLLS_MANAGE, label: "Manage Polls", description: "Create, edit, delete, and monitor member voting polls.", group: "Communication" },
];

export const allPermissions = permissionDefinitions.map(permission => permission.key);

export const pageAccessDefinitions: PageAccessDefinition[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/",
    description: "Workspace overview, summaries, and operational metrics.",
    group: "Operations",
    visibilityPermissions: [PERMISSION.DASHBOARD_VIEW],
    enablePermission: PERMISSION.DASHBOARD_VIEW,
  },
  {
    key: "members",
    label: "Member Directory",
    path: "/members",
    description: "Member listing, profile access, and basic congregation records.",
    group: "Operations",
    visibilityPermissions: [PERMISSION.MEMBERS_VIEW],
    enablePermission: PERMISSION.MEMBERS_VIEW,
  },
  {
    key: "attendance",
    label: "Attendance",
    path: "/attendance",
    description: "Attendance sessions, reports, trends, and absentee follow-up entry points.",
    group: "Operations",
    visibilityPermissions: [PERMISSION.ATTENDANCE_VIEW],
    enablePermission: PERMISSION.ATTENDANCE_VIEW,
  },
  {
    key: "units",
    label: "Unit Management",
    path: "/units",
    description: "Unit list, unit roster views, and unit workspace access.",
    group: "Operations",
    visibilityPermissions: [PERMISSION.UNITS_VIEW, PERMISSION.UNITS_MANAGE],
    enablePermission: PERMISSION.UNITS_VIEW,
  },
  {
    key: "outreach",
    label: "Outreach",
    path: "/outreach",
    description: "WhatsApp-ready outreach lists and communication workflows.",
    group: "Operations",
    visibilityPermissions: [PERMISSION.OUTREACH_VIEW],
    enablePermission: PERMISSION.OUTREACH_VIEW,
  },
  {
    key: "designs",
    label: "Birthday Management",
    path: "/designs",
    description: "Birthday templates, greeting messages, and generated celebration assets.",
    group: "Operations",
    visibilityPermissions: [PERMISSION.BIRTHDAYS_MANAGE],
    enablePermission: PERMISSION.BIRTHDAYS_MANAGE,
  },
  {
    key: "settings",
    label: "Settings",
    path: "/settings",
    description: "Church identity, admin users, role permissions, and system configuration.",
    group: "System",
    visibilityPermissions: [PERMISSION.SETTINGS_MANAGE, PERMISSION.ADMINS_MANAGE],
    enablePermission: PERMISSION.SETTINGS_MANAGE,
  },
  {
    key: "polls",
    label: "Polls",
    path: "/polls-manage",
    description: "Manage voting polls, candidate nominations, and real-time voter turnout.",
    group: "Operations",
    visibilityPermissions: [PERMISSION.POLLS_MANAGE],
    enablePermission: PERMISSION.POLLS_MANAGE,
  },
];

export const roleLabels: Record<string, string> = {
  [ADMIN_ROLE.SUPER_ADMIN]: "Super Admin",
  [ADMIN_ROLE.PASTOR]: "Pastor",
  [ADMIN_ROLE.ASSISTANT_PASTOR]: "Assistant Pastor",
  [ADMIN_ROLE.SECRETARY]: "Secretary",
  [ADMIN_ROLE.MEDIA]: "Media",
  [ADMIN_ROLE.FOLLOW_UP]: "Follow-Up",
  [ADMIN_ROLE.UNIT_LEADER]: "Unit Leader",
};

export const roleDescriptions: Record<BuiltInAdminRole, string> = {
  [ADMIN_ROLE.SUPER_ADMIN]: "Full system access for legacy super admin accounts and platform owners.",
  [ADMIN_ROLE.PASTOR]: "Senior ministry oversight across members, units, attendance, outreach, and birthdays.",
  [ADMIN_ROLE.ASSISTANT_PASTOR]: "Assistant ministry oversight with operational access across people, units, and attendance.",
  [ADMIN_ROLE.SECRETARY]: "Administrative data management for members, attendance, and units.",
  [ADMIN_ROLE.MEDIA]: "Media and birthday communication support.",
  [ADMIN_ROLE.FOLLOW_UP]: "Attendance follow-up and outreach operations.",
  [ADMIN_ROLE.UNIT_LEADER]: "Unit-facing access for HODs and assistants.",
};

export const rolePermissions: Record<BuiltInAdminRole, Permission[]> = {
  [ADMIN_ROLE.SUPER_ADMIN]: [
    PERMISSION.DASHBOARD_VIEW,
    PERMISSION.MEMBERS_VIEW,
    PERMISSION.MEMBERS_MANAGE,
    PERMISSION.ATTENDANCE_VIEW,
    PERMISSION.ATTENDANCE_MANAGE,
    PERMISSION.FOLLOWUPS_MANAGE,
    PERMISSION.UNITS_VIEW,
    PERMISSION.UNITS_MANAGE,
    PERMISSION.BIRTHDAYS_MANAGE,
    PERMISSION.OUTREACH_VIEW,
    PERMISSION.SETTINGS_MANAGE,
    PERMISSION.ADMINS_MANAGE,
    PERMISSION.POLLS_MANAGE,
  ],
  [ADMIN_ROLE.PASTOR]: [
    PERMISSION.DASHBOARD_VIEW,
    PERMISSION.MEMBERS_VIEW,
    PERMISSION.ATTENDANCE_VIEW,
    PERMISSION.ATTENDANCE_MANAGE,
    PERMISSION.FOLLOWUPS_MANAGE,
    PERMISSION.UNITS_VIEW,
    PERMISSION.UNITS_MANAGE,
    PERMISSION.BIRTHDAYS_MANAGE,
    PERMISSION.OUTREACH_VIEW,
    PERMISSION.POLLS_MANAGE,
  ],
  [ADMIN_ROLE.ASSISTANT_PASTOR]: [
    PERMISSION.DASHBOARD_VIEW,
    PERMISSION.MEMBERS_VIEW,
    PERMISSION.ATTENDANCE_VIEW,
    PERMISSION.ATTENDANCE_MANAGE,
    PERMISSION.FOLLOWUPS_MANAGE,
    PERMISSION.UNITS_VIEW,
    PERMISSION.UNITS_MANAGE,
    PERMISSION.OUTREACH_VIEW,
  ],
  [ADMIN_ROLE.SECRETARY]: [
    PERMISSION.DASHBOARD_VIEW,
    PERMISSION.MEMBERS_VIEW,
    PERMISSION.MEMBERS_MANAGE,
    PERMISSION.ATTENDANCE_VIEW,
    PERMISSION.ATTENDANCE_MANAGE,
    PERMISSION.UNITS_VIEW,
    PERMISSION.UNITS_MANAGE,
  ],
  [ADMIN_ROLE.MEDIA]: [
    PERMISSION.DASHBOARD_VIEW,
    PERMISSION.MEMBERS_VIEW,
    PERMISSION.BIRTHDAYS_MANAGE,
    PERMISSION.OUTREACH_VIEW,
  ],
  [ADMIN_ROLE.FOLLOW_UP]: [
    PERMISSION.DASHBOARD_VIEW,
    PERMISSION.MEMBERS_VIEW,
    PERMISSION.ATTENDANCE_VIEW,
    PERMISSION.FOLLOWUPS_MANAGE,
    PERMISSION.OUTREACH_VIEW,
  ],
  [ADMIN_ROLE.UNIT_LEADER]: [
    PERMISSION.DASHBOARD_VIEW,
    PERMISSION.MEMBERS_VIEW,
    PERMISSION.ATTENDANCE_VIEW,
    PERMISSION.OUTREACH_VIEW,
    PERMISSION.UNITS_VIEW,
  ],
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
