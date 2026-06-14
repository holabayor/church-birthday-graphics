export const AUTH_ACTION = {
  LOGOUT: "logout",
  MEMBER_LOGIN: "member-login",
  MEMBER_REGISTER: "member-register",
} as const;

export type AuthAction = (typeof AUTH_ACTION)[keyof typeof AUTH_ACTION];
