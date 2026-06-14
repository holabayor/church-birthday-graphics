import type { AttendanceStatus, FollowUpStatus } from "@/lib/attendanceStatus";
import type { UnitRole } from "@/lib/unitRoles";

export interface Member {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number?: string | null;
  email?: string | null;
  date_of_birth: string;
  position: string | null;
  life_stage?: string | null;
  membership_status?: string | null;
  institution?: string | null;
  department?: string | null;
  academic_level?: string | null;
  student_status?: string | null;
  residence?: string | null;
  cell_group?: string | null;
  nysc_state?: string | null;
  nysc_ppa?: string | null;
  employer?: string | null;
  job_title?: string | null;
  work_location?: string | null;
  graduation_year?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  skills_interests?: string | null;
  units?: MemberUnitAssignment[];
  photo_url: string | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ChurchUnit {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberUnitAssignment extends ChurchUnit {
  role: UnitRole;
}

export interface ChurchSettings {
  id: string;
  church_name: string;
  church_address?: string;
  logo_url: string | null;
  updated_at: string;
}

export interface BirthdayLog {
  id: string;
  member_id: string;
  design_variant: number;
  image_url: string | null;
  sent_at: string;
  status: string;
}

export interface AttendanceSession {
  id: string;
  title: string;
  service_type: string;
  session_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  member_id: string;
  status: AttendanceStatus;
  marked_at: string;
}

export interface AbsenteeFollowUp {
  id: string;
  session_id: string;
  member_id: string;
  status: FollowUpStatus;
  notes: string | null;
  assigned_to: string | null;
  updated_at: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
