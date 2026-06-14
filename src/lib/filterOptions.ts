export const FILTER_VALUE = {
  ALL: "all",
  NONE: "none",
} as const;

export const birthMonthOptions = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

export const memberSortOptions = [
  { value: "first_name-asc", label: "First name, A-Z" },
  { value: "first_name-desc", label: "First name, Z-A" },
  { value: "last_name-asc", label: "Last name, A-Z" },
  { value: "last_name-desc", label: "Last name, Z-A" },
  { value: "date_of_birth-asc", label: "Birthday, earliest" },
  { value: "date_of_birth-desc", label: "Birthday, latest" },
] as const;
