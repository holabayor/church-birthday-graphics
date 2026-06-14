export const UNIT_ROLE = {
  MEMBER: "member",
  ASSISTANT: "assistant",
  HEAD: "head",
} as const;

export type UnitRole = (typeof UNIT_ROLE)[keyof typeof UNIT_ROLE];
export type UnitLeadershipRole = typeof UNIT_ROLE.HEAD | typeof UNIT_ROLE.ASSISTANT;

export const unitRoleOptions = [
  { value: UNIT_ROLE.MEMBER, label: "Member" },
  { value: UNIT_ROLE.ASSISTANT, label: "Assistant" },
  { value: UNIT_ROLE.HEAD, label: "HOD / Head" },
] as const;

export const unitRoleLabels: Record<UnitRole, string> = Object.fromEntries(
  unitRoleOptions.map(option => [option.value, option.label])
) as Record<UnitRole, string>;

export const unitLeadershipRoleOptions = unitRoleOptions.filter(
  option => option.value === UNIT_ROLE.HEAD || option.value === UNIT_ROLE.ASSISTANT
) as Array<{ value: UnitLeadershipRole; label: string }>;

export const unitRoleSortRank: Record<UnitRole, number> = {
  [UNIT_ROLE.HEAD]: 0,
  [UNIT_ROLE.ASSISTANT]: 1,
  [UNIT_ROLE.MEMBER]: 2,
};

export function normalizeUnitRole(value?: string | null): UnitRole {
  return unitRoleOptions.some(option => option.value === value) ? (value as UnitRole) : UNIT_ROLE.MEMBER;
}
