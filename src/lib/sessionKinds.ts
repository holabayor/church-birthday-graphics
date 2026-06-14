export const SESSION_KIND = {
  SUPER_ADMIN: "super_admin",
  MEMBER: "member",
} as const;

export type SessionKind = (typeof SESSION_KIND)[keyof typeof SESSION_KIND];
