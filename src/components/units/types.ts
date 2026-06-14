import type { UnitLeadershipRole, UnitRole } from "@/lib/unitRoles";
import { unitRoleLabels } from "@/lib/unitRoles";

export type { UnitRole };
export { unitRoleLabels };

export interface UnitMember {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number?: string | null;
  email?: string | null;
  life_stage?: string | null;
  membership_status?: string | null;
  photo_url?: string | null;
  is_active?: boolean | null;
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
    role: "admin" | UnitLeadershipRole | null;
  };
  created_at?: string;
  updated_at?: string;
}

export interface UnitManagementAccess {
  can_manage_all_units: boolean;
  can_view_all_units: boolean;
}
