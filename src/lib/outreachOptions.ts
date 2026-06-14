export const OUTREACH_TYPE = {
  BIRTHDAYS: "birthdays",
  ABSENTEES: "absentees",
  UNITS: "units",
} as const;

export const BIRTHDAY_RANGE = {
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
} as const;

export type OutreachType = (typeof OUTREACH_TYPE)[keyof typeof OUTREACH_TYPE];
export type BirthdayRange = (typeof BIRTHDAY_RANGE)[keyof typeof BIRTHDAY_RANGE];

export const outreachTypeOptions = [
  { value: OUTREACH_TYPE.BIRTHDAYS, label: "Birthdays" },
  { value: OUTREACH_TYPE.ABSENTEES, label: "Absentees" },
  { value: OUTREACH_TYPE.UNITS, label: "Units" },
] as const;

export const birthdayRangeOptions = [
  { value: BIRTHDAY_RANGE.TODAY, label: "Today" },
  { value: BIRTHDAY_RANGE.WEEK, label: "Next 7 days" },
  { value: BIRTHDAY_RANGE.MONTH, label: "Next 31 days" },
] as const;
