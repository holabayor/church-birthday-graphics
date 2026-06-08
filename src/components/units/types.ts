export type UnitRole = "member" | "assistant" | "head";

export const unitRoleLabels: Record<UnitRole, string> = {
  member: "Member",
  assistant: "Assistant",
  head: "Head",
};

export interface UnitMember {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number?: string | null;
  email?: string | null;
  member_type?: string | null;
  photo_url?: string | null;
  is_active?: boolean;
  unit_role: UnitRole;
}

export interface ManagedUnit {
  id: string;
  name: string;
  description: string | null;
  members: UnitMember[];
  stats: {
    total_members: number;
    heads: number;
    assistants: number;
  };
  access: {
    can_manage_details: boolean;
    can_manage_members: boolean;
    role: "admin" | "head" | "assistant" | null;
  };
  created_at?: string;
  updated_at?: string;
}

export interface UnitManagementAccess {
  can_manage_all_units: boolean;
  can_view_all_units: boolean;
}
