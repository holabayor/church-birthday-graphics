# Supabase Setup Guide

This project requires a Supabase backend for database and storage functionality. Follow these steps to set up your project.

## 1. Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once created, go to **Project Settings** -> **API**.
3. Copy the **Project URL** and **anon public key**.

## 2. Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
CRON_SECRET=your_cron_secret
# Optional: Service Role Key for administrative tasks (if implemented later)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 3. Database Schema
# Supabase Setup Guide

This project requires a Supabase backend for database and storage functionality. Follow these steps to set up your project.

## 1. Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once created, go to **Project Settings** -> **API**.
3. Copy the **Project URL** and **anon public key**.

## 2. Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
CRON_SECRET=your_cron_secret
# Optional: Service Role Key for administrative tasks (if implemented later)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 3. Database Schema

Run the following SQL in your Supabase **SQL Editor** to create the necessary tables and policies.

> **Note:** The current implementation uses the anonymous key for all operations. For security in a real production environment, you should implement Row Level Security (RLS) with proper Authentication policies. The policies below allow public access to facilitate the current setup.

```sql
-- 1. Create Members Table
create table if not exists members (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  middle_name text,
  last_name text not null,
  phone_number text,
  email text,
  date_of_birth date not null,
  life_stage text default 'other',
  membership_status text default 'active',
  position text,
  photo_url text,
  -- Legacy compatibility column. New member availability logic uses membership_status.
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create lifecycle profile tables
create table if not exists member_student_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  institution text,
  department text,
  academic_level text,
  student_status text default 'active_student',
  residence text,
  guardian_name text,
  guardian_phone text,
  graduation_year text,
  updated_at timestamptz default now()
);

create table if not exists member_nysc_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  nysc_state text,
  nysc_ppa text,
  residence text,
  updated_at timestamptz default now()
);

create table if not exists member_work_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  employer text,
  job_title text,
  work_location text,
  updated_at timestamptz default now()
);

create table if not exists member_church_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  cell_group text,
  skills_interests text,
  updated_at timestamptz default now()
);

-- 3. Create Church Units Tables
create table if not exists church_units (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists church_unit_members (
  unit_id uuid references church_units(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  role text default 'member' check (role in ('member', 'assistant', 'head')),
  created_at timestamptz default now(),
  primary key (unit_id, member_id)
);

-- 4. Create Attendance Tables
create table if not exists attendance_sessions (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  service_type text default 'service',
  session_date date not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists attendance_records (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references attendance_sessions(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  status text not null default 'present' check (status in ('present', 'absent', 'excused')),
  marked_at timestamptz default now(),
  unique (session_id, member_id)
);

create table if not exists absentee_followups (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references attendance_sessions(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'visited', 'resolved', 'no_response')),
  notes text,
  assigned_to text,
  updated_at timestamptz default now(),
  unique (session_id, member_id)
);

-- 5. Create Admin Profiles Table
create table if not exists admin_profiles (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  full_name text,
  role text not null default 'secretary' check (role in ('super_admin', 'pastor', 'assistant_pastor', 'secretary', 'media', 'follow_up', 'unit_leader')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Create Church Settings Table
create table if not exists church_settings (
  id uuid default gen_random_uuid() primary key,
  church_name text not null,
  church_address text,
  logo_url text,
  updated_at timestamptz default now()
);

-- 7. Create Birthday Logs Table
create table if not exists birthday_logs (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references members(id) on delete cascade,
  design_variant int not null,
  image_url text,
  sent_at timestamptz default now(),
  status text default 'generated'
);

-- 8. Create Birthday Messages Table
create table if not exists birthday_messages (
  id uuid default gen_random_uuid() primary key,
  message text not null,
  created_at timestamptz default now()
);

-- 9. Enable Row Level Security (RLS)
alter table members enable row level security;
alter table member_student_profiles enable row level security;
alter table member_nysc_profiles enable row level security;
alter table member_work_profiles enable row level security;
alter table member_church_profiles enable row level security;
alter table church_units enable row level security;
alter table church_unit_members enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;
alter table absentee_followups enable row level security;
alter table admin_profiles enable row level security;
alter table church_settings enable row level security;
alter table birthday_logs enable row level security;
alter table birthday_messages enable row level security;

-- 10. Create Policies (Permissive for now - specific to current implementation)
-- Allow unlimited access for now since auth is handled via application code or not fully enforced yet.
drop policy if exists "Allow public access to members" on members;
create policy "Allow public access to members"
on members for all using (true) with check (true);

drop policy if exists "Allow public access to member_student_profiles" on member_student_profiles;
create policy "Allow public access to member_student_profiles"
on member_student_profiles for all using (true) with check (true);

drop policy if exists "Allow public access to member_nysc_profiles" on member_nysc_profiles;
create policy "Allow public access to member_nysc_profiles"
on member_nysc_profiles for all using (true) with check (true);

drop policy if exists "Allow public access to member_work_profiles" on member_work_profiles;
create policy "Allow public access to member_work_profiles"
on member_work_profiles for all using (true) with check (true);

drop policy if exists "Allow public access to member_church_profiles" on member_church_profiles;
create policy "Allow public access to member_church_profiles"
on member_church_profiles for all using (true) with check (true);

drop policy if exists "Allow public access to church_units" on church_units;
create policy "Allow public access to church_units"
on church_units for all using (true) with check (true);

drop policy if exists "Allow public access to church_unit_members" on church_unit_members;
create policy "Allow public access to church_unit_members"
on church_unit_members for all using (true) with check (true);

drop policy if exists "Allow public access to attendance_sessions" on attendance_sessions;
create policy "Allow public access to attendance_sessions"
on attendance_sessions for all using (true) with check (true);

drop policy if exists "Allow public access to attendance_records" on attendance_records;
create policy "Allow public access to attendance_records"
on attendance_records for all using (true) with check (true);

drop policy if exists "Allow public access to absentee_followups" on absentee_followups;
create policy "Allow public access to absentee_followups"
on absentee_followups for all using (true) with check (true);

drop policy if exists "Allow public access to admin_profiles" on admin_profiles;
create policy "Allow public access to admin_profiles"
on admin_profiles for all using (true) with check (true);

drop policy if exists "Allow public access to church_settings" on church_settings;
create policy "Allow public access to church_settings"
on church_settings for all using (true) with check (true);

drop policy if exists "Allow public access to birthday_logs" on birthday_logs;
create policy "Allow public access to birthday_logs"
on birthday_logs for all using (true) with check (true);

drop policy if exists "Allow public access to birthday_messages" on birthday_messages;
create policy "Allow public access to birthday_messages"
on birthday_messages for all using (true) with check (true);
```

If you already created the `members` table before lifecycle profiles were normalized, run this migration instead of recreating the table. It preserves old flat data by copying it into related profile tables.

```sql
alter table members
  add column if not exists life_stage text default 'other';

alter table members
  add column if not exists membership_status text default 'active';

alter table members
  alter column life_stage set default 'other';

alter table members
  alter column membership_status set default 'active';

update members
set life_stage = case
  when life_stage in ('member', 'minister', 'pastor') or life_stage is null then 'other'
  when life_stage = 'nysc' then 'nysc_corper'
  when life_stage = 'worker' then 'working_class'
  when life_stage = 'alumnus' then 'graduate'
  else life_stage
end;

update members
set membership_status = case
  when is_active = false then 'inactive'
  when membership_status is null then 'active'
  else membership_status
end;

create table if not exists member_student_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  institution text,
  department text,
  academic_level text,
  student_status text default 'active_student',
  residence text,
  guardian_name text,
  guardian_phone text,
  graduation_year text,
  updated_at timestamptz default now()
);

create table if not exists member_nysc_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  nysc_state text,
  nysc_ppa text,
  residence text,
  updated_at timestamptz default now()
);

create table if not exists member_work_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  employer text,
  job_title text,
  work_location text,
  updated_at timestamptz default now()
);

create table if not exists member_church_profiles (
  member_id uuid primary key references members(id) on delete cascade,
  cell_group text,
  skills_interests text,
  updated_at timestamptz default now()
);

create table if not exists church_units (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists church_unit_members (
  unit_id uuid references church_units(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  role text default 'member' check (role in ('member', 'assistant', 'head')),
  created_at timestamptz default now(),
  primary key (unit_id, member_id)
);

create table if not exists attendance_sessions (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  service_type text default 'service',
  session_date date not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists attendance_records (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references attendance_sessions(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  status text not null default 'present' check (status in ('present', 'absent', 'excused')),
  marked_at timestamptz default now(),
  unique (session_id, member_id)
);

create table if not exists absentee_followups (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references attendance_sessions(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'visited', 'resolved', 'no_response')),
  notes text,
  assigned_to text,
  updated_at timestamptz default now(),
  unique (session_id, member_id)
);

create table if not exists admin_profiles (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  full_name text,
  role text not null default 'secretary' check (role in ('super_admin', 'pastor', 'assistant_pastor', 'secretary', 'media', 'follow_up', 'unit_leader')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into member_student_profiles (
  member_id,
  institution,
  department,
  academic_level,
  student_status,
  residence,
  guardian_name,
  guardian_phone
)
select id, institution, department, academic_level, student_status, residence, guardian_name, guardian_phone
from members
where institution is not null
   or department is not null
   or academic_level is not null
   or student_status is not null
   or residence is not null
   or guardian_name is not null
   or guardian_phone is not null
on conflict (member_id) do nothing;

insert into member_church_profiles (member_id, cell_group, skills_interests)
select id, cell_group, skills_interests
from members
where cell_group is not null or skills_interests is not null
on conflict (member_id) do nothing;

alter table member_student_profiles enable row level security;
alter table member_nysc_profiles enable row level security;
alter table member_work_profiles enable row level security;
alter table member_church_profiles enable row level security;
alter table church_units enable row level security;
alter table church_unit_members enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;
alter table absentee_followups enable row level security;
alter table admin_profiles enable row level security;

drop policy if exists "Allow public access to member_student_profiles" on member_student_profiles;
create policy "Allow public access to member_student_profiles"
on member_student_profiles for all using (true) with check (true);

drop policy if exists "Allow public access to member_nysc_profiles" on member_nysc_profiles;
create policy "Allow public access to member_nysc_profiles"
on member_nysc_profiles for all using (true) with check (true);

drop policy if exists "Allow public access to member_work_profiles" on member_work_profiles;
create policy "Allow public access to member_work_profiles"
on member_work_profiles for all using (true) with check (true);

drop policy if exists "Allow public access to member_church_profiles" on member_church_profiles;
create policy "Allow public access to member_church_profiles"
on member_church_profiles for all using (true) with check (true);

drop policy if exists "Allow public access to church_units" on church_units;
create policy "Allow public access to church_units"
on church_units for all using (true) with check (true);

drop policy if exists "Allow public access to church_unit_members" on church_unit_members;
create policy "Allow public access to church_unit_members"
on church_unit_members for all using (true) with check (true);

drop policy if exists "Allow public access to attendance_sessions" on attendance_sessions;
create policy "Allow public access to attendance_sessions"
on attendance_sessions for all using (true) with check (true);

drop policy if exists "Allow public access to attendance_records" on attendance_records;
create policy "Allow public access to attendance_records"
on attendance_records for all using (true) with check (true);

drop policy if exists "Allow public access to absentee_followups" on absentee_followups;
create policy "Allow public access to absentee_followups"
on absentee_followups for all using (true) with check (true);

drop policy if exists "Allow public access to admin_profiles" on admin_profiles;
create policy "Allow public access to admin_profiles"
on admin_profiles for all using (true) with check (true);
```

### Role and Permission Management Migration

Run this after the base schema when you are ready to manage role permissions from the app UI.

```sql
alter table admin_profiles
drop constraint if exists admin_profiles_role_check;

create table if not exists app_roles (
  key text primary key,
  name text not null,
  description text,
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_role_permissions (
  role_key text references app_roles(key) on delete cascade,
  permission text not null,
  created_at timestamptz default now(),
  primary key (role_key, permission)
);

alter table app_roles enable row level security;
alter table app_role_permissions enable row level security;

drop policy if exists "Allow public access to app_roles" on app_roles;
create policy "Allow public access to app_roles"
on app_roles for all using (true) with check (true);

drop policy if exists "Allow public access to app_role_permissions" on app_role_permissions;
create policy "Allow public access to app_role_permissions"
on app_role_permissions for all using (true) with check (true);

insert into app_roles (key, name, description, is_system)
values
  ('super_admin', 'Super Admin', 'Full system access for legacy super admin accounts and platform owners.', true),
  ('pastor', 'Pastor', 'Senior ministry oversight across members, units, attendance, outreach, and birthdays.', true),
  ('assistant_pastor', 'Assistant Pastor', 'Assistant ministry oversight with operational access across people, units, and attendance.', true),
  ('secretary', 'Secretary', 'Administrative data management for members, attendance, and units.', true),
  ('media', 'Media', 'Media and birthday communication support.', true),
  ('follow_up', 'Follow-Up', 'Attendance follow-up and outreach operations.', true),
  ('unit_leader', 'Unit Leader', 'Unit-facing access for HODs and assistants.', true)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  is_system = excluded.is_system,
  updated_at = now();

insert into app_role_permissions (role_key, permission)
values
  ('super_admin', 'dashboard.view'),
  ('super_admin', 'members.view'),
  ('super_admin', 'members.manage'),
  ('super_admin', 'attendance.view'),
  ('super_admin', 'attendance.manage'),
  ('super_admin', 'followups.manage'),
  ('super_admin', 'units.view'),
  ('super_admin', 'units.manage'),
  ('super_admin', 'birthdays.manage'),
  ('super_admin', 'outreach.view'),
  ('super_admin', 'settings.manage'),
  ('super_admin', 'admins.manage'),
  ('pastor', 'dashboard.view'),
  ('pastor', 'members.view'),
  ('pastor', 'attendance.view'),
  ('pastor', 'attendance.manage'),
  ('pastor', 'followups.manage'),
  ('pastor', 'units.view'),
  ('pastor', 'units.manage'),
  ('pastor', 'birthdays.manage'),
  ('pastor', 'outreach.view'),
  ('assistant_pastor', 'dashboard.view'),
  ('assistant_pastor', 'members.view'),
  ('assistant_pastor', 'attendance.view'),
  ('assistant_pastor', 'attendance.manage'),
  ('assistant_pastor', 'followups.manage'),
  ('assistant_pastor', 'units.view'),
  ('assistant_pastor', 'units.manage'),
  ('assistant_pastor', 'outreach.view'),
  ('secretary', 'dashboard.view'),
  ('secretary', 'members.view'),
  ('secretary', 'members.manage'),
  ('secretary', 'attendance.view'),
  ('secretary', 'attendance.manage'),
  ('secretary', 'units.view'),
  ('secretary', 'units.manage'),
  ('media', 'dashboard.view'),
  ('media', 'members.view'),
  ('media', 'birthdays.manage'),
  ('media', 'outreach.view'),
  ('follow_up', 'dashboard.view'),
  ('follow_up', 'members.view'),
  ('follow_up', 'attendance.view'),
  ('follow_up', 'followups.manage'),
  ('follow_up', 'outreach.view'),
  ('unit_leader', 'dashboard.view'),
  ('unit_leader', 'members.view'),
  ('unit_leader', 'attendance.view'),
  ('unit_leader', 'outreach.view'),
  ('unit_leader', 'units.view')
on conflict (role_key, permission) do nothing;
```

## 4. Storage Setup

1. Go to **Storage** in your Supabase dashboard.
2. Create a new bucket named `church-assets`.
3. Toggle "Public Bucket" to **ON**.
4. Run the following SQL in your **SQL Editor** to allow uploads to this bucket:

```sql
-- Allow public uploads
create policy "Allow public uploads"
on storage.objects for insert
with check ( bucket_id = 'church-assets' );

-- Allow public viewing
create policy "Allow public viewing"
on storage.objects for select
using ( bucket_id = 'church-assets' );

-- Allow public updates (optional, for replacing files)
create policy "Allow public updates"
on storage.objects for update
using ( bucket_id = 'church-assets' );

-- Allow public deletes (optional, for removing files)
create policy "Allow public deletes"
on storage.objects for delete
using ( bucket_id = 'church-assets' );
```

## 5. Mock Data (Optional)

Insert a dummy church setting to start:

```sql
insert into church_settings (church_name, church_address)
values ('My Local Church', '123 Faith Way');

-- Insert default birthday messages
insert into birthday_messages (message) values
('May the Lord continue to bless you and keep you. May His face shine upon you and give you peace throughout this new year.'),
('Wishing you a wonderful birthday filled with God''s grace and blessings. May this new year of your life be filled with joy, peace, and abundant love!'),
('On your special day, we celebrate the gift you are to our church family. May God''s blessings overflow in your life today and always!'),
('Rejoice, for this is the day the Lord has made! Happy Birthday! May you be blessed with good health, happiness, and divine favor.'),
('Happy Birthday! As you mark another year of God''s faithfulness, may you continue to grow in grace and in the knowledge of our Lord Jesus Christ.');
```

## 6. Polls Database Tables

Run the following SQL in your Supabase **SQL Editor** to create the tables required for the Poll Management System:

```sql
-- 1. Create Polls Table
create table if not exists polls (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique,
  description text,
  voter_type text not null check (voter_type in ('anyone', 'members', 'workers', 'selected_groups')),
  allowed_groups uuid[] default '{}',
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  allow_view_results boolean default true,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create Poll Candidates Table
create table if not exists poll_candidates (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade not null,
  member_id uuid references members(id) on delete set null,
  display_name text not null,
  photo_url text,
  nomination_reason text,
  created_at timestamptz default now()
);

-- 3. Create Poll Votes Table
create table if not exists poll_votes (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade not null,
  candidate_id uuid references poll_candidates(id) on delete cascade not null,
  voter_member_id uuid references members(id) on delete set null,
  voter_ip text,
  voter_fingerprint text,
  created_at timestamptz default now(),
  unique (poll_id, voter_member_id)
);

-- Create index for quick vote counts
create index if not exists idx_votes_poll_candidate on poll_votes(poll_id, candidate_id);

-- Enable RLS on Polls tables
alter table polls enable row level security;
alter table poll_candidates enable row level security;
alter table poll_votes enable row level security;

-- Create policies for Polls tables
drop policy if exists "Allow public access to polls" on polls;
create policy "Allow public access to polls"
on polls for all using (true) with check (true);

drop policy if exists "Allow public access to poll_candidates" on poll_candidates;
create policy "Allow public access to poll_candidates"
on poll_candidates for all using (true) with check (true);

drop policy if exists "Allow public access to poll_votes" on poll_votes;
create policy "Allow public access to poll_votes"
on poll_votes for all using (true) with check (true);
```

## Migration: Add Slug Support to Polls

If you are updating an existing database, run the following SQL command in your Supabase SQL Editor:

```sql
alter table polls add column if not exists slug text unique;
```

