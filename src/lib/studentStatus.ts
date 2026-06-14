export const STUDENT_STATUS = {
  ACTIVE: "active_student",
  FRESHER: "fresher",
  FINAL_YEAR: "final_year",
} as const;

export type StudentStatus = (typeof STUDENT_STATUS)[keyof typeof STUDENT_STATUS];

export const studentStatusOptions = [
  { value: STUDENT_STATUS.ACTIVE, label: "Active Student" },
  { value: STUDENT_STATUS.FRESHER, label: "Fresher" },
  { value: STUDENT_STATUS.FINAL_YEAR, label: "Final Year" },
] as const;

export function getStudentStatusLabel(value?: string | null) {
  return studentStatusOptions.find(option => option.value === value)?.label || studentStatusOptions[0].label;
}
