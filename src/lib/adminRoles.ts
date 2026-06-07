export type AdminRole = "super_admin" | "pastor" | "assistant_pastor" | "secretary" | "media" | "follow_up" | "unit_leader";

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

export const roleLabels: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  pastor: "Pastor",
  assistant_pastor: "Assistant Pastor",
  secretary: "Secretary",
  media: "Media",
  follow_up: "Follow-Up",
  unit_leader: "Unit Leader",
};

export const rolePermissions: Record<AdminRole, Permission[]> = {
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
