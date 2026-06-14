import { LIFE_STAGE, normalizeLifeStage, usesNyscProfile, usesStudentProfile, usesWorkProfile } from "@/lib/memberLifecycle";

const studentFields = [
  "institution",
  "department",
  "academic_level",
  "student_status",
  "residence",
  "guardian_name",
  "guardian_phone",
  "graduation_year",
];

const nyscFields = ["nysc_state", "nysc_ppa", "residence"];
const workFields = ["employer", "job_title", "work_location"];
const churchFields = ["cell_group", "skills_interests"];

const hasAnyValue = (body: Record<string, unknown>, fields: string[]) =>
  fields.some(field => typeof body[field] === "string" && String(body[field]).trim().length > 0);

const pickProfile = (body: Record<string, unknown>, fields: string[]) =>
  Object.fromEntries(fields.map(field => [field, body[field] || null]));

const mapByMemberId = (rows: any[] | null) =>
  new Map((rows || []).map(row => [row.member_id, row]));

export async function attachMemberProfiles(supabase: any, members: any[]) {
  const ids = members.map(member => member.id).filter(Boolean);
  if (ids.length === 0) return members;

  const [studentRes, nyscRes, workRes, churchRes] = await Promise.all([
    supabase.from("member_student_profiles").select("*").in("member_id", ids),
    supabase.from("member_nysc_profiles").select("*").in("member_id", ids),
    supabase.from("member_work_profiles").select("*").in("member_id", ids),
    supabase.from("member_church_profiles").select("*").in("member_id", ids),
  ]);

  const studentProfiles = mapByMemberId(studentRes.data);
  const nyscProfiles = mapByMemberId(nyscRes.data);
  const workProfiles = mapByMemberId(workRes.data);
  const churchProfiles = mapByMemberId(churchRes.data);

  return members.map(member => {
    const lifeStage = normalizeLifeStage(member.life_stage || member.member_type);
    const memberWithoutStaleProfileFields = {
      ...member,
      institution: null,
      department: null,
      academic_level: null,
      student_status: null,
      residence: null,
      guardian_name: null,
      guardian_phone: null,
      graduation_year: null,
      nysc_state: null,
      nysc_ppa: null,
      employer: null,
      job_title: null,
      work_location: null,
      cell_group: null,
      skills_interests: null,
    };
    const churchProfile = churchProfiles.get(member.id) || {};
    const lifecycleProfile =
      usesStudentProfile(lifeStage)
        ? studentProfiles.get(member.id) || {}
        : usesNyscProfile(lifeStage)
          ? nyscProfiles.get(member.id) || {}
          : usesWorkProfile(lifeStage)
            ? workProfiles.get(member.id) || {}
            : {};

    const transitionProfile = usesStudentProfile(lifeStage) && usesWorkProfile(lifeStage)
      ? { ...(studentProfiles.get(member.id) || {}), ...(workProfiles.get(member.id) || {}) }
      : lifecycleProfile;

    return {
      ...memberWithoutStaleProfileFields,
      ...churchProfile,
      ...transitionProfile,
      life_stage: lifeStage,
    };
  });
}

export async function saveMemberProfiles(supabase: any, memberId: string, body: Record<string, unknown>) {
  const lifeStage = normalizeLifeStage(String(body.life_stage || LIFE_STAGE.OTHER));
  const updatedAt = new Date().toISOString();

  const updates = [];

  if (hasAnyValue(body, churchFields)) {
    updates.push(
      supabase
        .from("member_church_profiles")
        .upsert({ member_id: memberId, ...pickProfile(body, churchFields), updated_at: updatedAt })
    );
  }

  if (usesStudentProfile(lifeStage) && hasAnyValue(body, studentFields)) {
    updates.push(
      supabase
        .from("member_student_profiles")
        .upsert({ member_id: memberId, ...pickProfile(body, studentFields), updated_at: updatedAt })
    );
  }

  if (usesNyscProfile(lifeStage) && hasAnyValue(body, nyscFields)) {
    updates.push(
      supabase
        .from("member_nysc_profiles")
        .upsert({ member_id: memberId, ...pickProfile(body, nyscFields), updated_at: updatedAt })
    );
  }

  if (usesWorkProfile(lifeStage) && hasAnyValue(body, workFields)) {
    updates.push(
      supabase
        .from("member_work_profiles")
        .upsert({ member_id: memberId, ...pickProfile(body, workFields), updated_at: updatedAt })
    );
  }

  const results = await Promise.all(updates);
  return results.find(result => result.error)?.error || null;
}
