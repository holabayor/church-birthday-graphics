export const LIFE_STAGE = {
  STUDENT: "student",
  NYSC_CORPER: "nysc_corper",
  WORKING_CLASS: "working_class",
  SELF_EMPLOYED: "self_employed",
  JOB_SEEKING: "job_seeking",
  GRADUATE: "graduate",
  VISITOR: "visitor",
  OTHER: "other",
} as const;

export const MEMBERSHIP_STATUS = {
  ACTIVE: "active",
  RELOCATED: "relocated",
  GRADUATED_LEFT: "graduated_left",
  TRANSFERRED: "transferred",
  INACTIVE: "inactive",
  UNKNOWN: "unknown",
} as const;

export const lifeStageOptions = [
  { value: LIFE_STAGE.STUDENT, label: "Student" },
  { value: LIFE_STAGE.NYSC_CORPER, label: "NYSC Corper" },
  { value: LIFE_STAGE.WORKING_CLASS, label: "Working Class" },
  { value: LIFE_STAGE.SELF_EMPLOYED, label: "Self-employed" },
  { value: LIFE_STAGE.JOB_SEEKING, label: "Job Seeking" },
  { value: LIFE_STAGE.GRADUATE, label: "Graduate" },
  { value: LIFE_STAGE.VISITOR, label: "Visitor" },
  { value: LIFE_STAGE.OTHER, label: "Other" },
] as const;

export const membershipStatusOptions = [
  { value: MEMBERSHIP_STATUS.ACTIVE, label: "Active" },
  { value: MEMBERSHIP_STATUS.RELOCATED, label: "Relocated" },
  { value: MEMBERSHIP_STATUS.GRADUATED_LEFT, label: "Graduated & Left" },
  { value: MEMBERSHIP_STATUS.TRANSFERRED, label: "Transferred" },
  { value: MEMBERSHIP_STATUS.INACTIVE, label: "Inactive" },
  { value: MEMBERSHIP_STATUS.UNKNOWN, label: "Unknown" },
] as const;

export type LifeStage = (typeof lifeStageOptions)[number]["value"];
export type MembershipStatus = (typeof membershipStatusOptions)[number]["value"];

const legacyLifeStageMap: Record<string, LifeStage> = {
  member: LIFE_STAGE.OTHER,
  nysc: LIFE_STAGE.NYSC_CORPER,
  worker: LIFE_STAGE.WORKING_CLASS,
  alumnus: LIFE_STAGE.GRADUATE,
  pastor: LIFE_STAGE.OTHER,
  minister: LIFE_STAGE.OTHER,
};

export const studentProfileLifeStages: LifeStage[] = [LIFE_STAGE.STUDENT, LIFE_STAGE.GRADUATE];
export const workingLifeStages: LifeStage[] = [
  LIFE_STAGE.WORKING_CLASS,
  LIFE_STAGE.SELF_EMPLOYED,
  LIFE_STAGE.JOB_SEEKING,
];
export const workProfileLifeStages: LifeStage[] = [...workingLifeStages, LIFE_STAGE.GRADUATE];
export const residenceLifeStages: LifeStage[] = [LIFE_STAGE.STUDENT, LIFE_STAGE.NYSC_CORPER, LIFE_STAGE.VISITOR];
export const guardianLifeStages: LifeStage[] = [LIFE_STAGE.STUDENT, LIFE_STAGE.VISITOR];

export function normalizeLifeStage(value?: string | null): LifeStage {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return LIFE_STAGE.OTHER;
  if (legacyLifeStageMap[normalized]) return legacyLifeStageMap[normalized];
  if (lifeStageOptions.some(option => option.value === normalized)) return normalized as LifeStage;
  return LIFE_STAGE.OTHER;
}

export function getLifeStageLabel(value?: string | null) {
  const stage = normalizeLifeStage(value);
  return lifeStageOptions.find(option => option.value === stage)?.label || "Other";
}

export function normalizeMembershipStatus(value?: string | null, legacyIsActive?: boolean | null): MembershipStatus {
  const normalized = value?.trim().toLowerCase();
  if (normalized && membershipStatusOptions.some(option => option.value === normalized)) {
    return normalized as MembershipStatus;
  }
  if (legacyIsActive === false) return MEMBERSHIP_STATUS.INACTIVE;
  return MEMBERSHIP_STATUS.ACTIVE;
}

export function getMembershipStatusLabel(value?: string | null, legacyIsActive?: boolean | null) {
  const status = normalizeMembershipStatus(value, legacyIsActive);
  return membershipStatusOptions.find(option => option.value === status)?.label || "Unknown";
}

export function isAvailableMember(value?: string | null, legacyIsActive?: boolean | null) {
  return normalizeMembershipStatus(value, legacyIsActive) === MEMBERSHIP_STATUS.ACTIVE;
}

export const usesStudentProfile = (value?: string | null) => studentProfileLifeStages.includes(normalizeLifeStage(value));
export const usesNyscProfile = (value?: string | null) => normalizeLifeStage(value) === LIFE_STAGE.NYSC_CORPER;
export const usesWorkProfile = (value?: string | null) => workProfileLifeStages.includes(normalizeLifeStage(value));
export const usesResidenceProfile = (value?: string | null) => residenceLifeStages.includes(normalizeLifeStage(value));
export const usesGuardianProfile = (value?: string | null) => guardianLifeStages.includes(normalizeLifeStage(value));
