export interface Member {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number?: string | null;
  email?: string | null;
  date_of_birth: string;
  position: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
