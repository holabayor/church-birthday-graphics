export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  EXCUSED: "excused",
} as const;

export const FOLLOW_UP_STATUS = {
  PENDING: "pending",
  CONTACTED: "contacted",
  VISITED: "visited",
  RESOLVED: "resolved",
  NO_RESPONSE: "no_response",
} as const;

export const SERVICE_TYPE = {
  SERVICE: "service",
  MIDWEEK: "midweek",
  EVENT: "event",
  MEETING: "meeting",
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];
export type FollowUpStatus = (typeof FOLLOW_UP_STATUS)[keyof typeof FOLLOW_UP_STATUS];
export type ServiceType = (typeof SERVICE_TYPE)[keyof typeof SERVICE_TYPE];

export const attendanceStatusOptions = [
  { value: ATTENDANCE_STATUS.PRESENT, label: "Present" },
  { value: ATTENDANCE_STATUS.ABSENT, label: "Absent" },
  { value: ATTENDANCE_STATUS.EXCUSED, label: "Excused" },
] as const;

export const followUpStatusOptions = [
  { value: FOLLOW_UP_STATUS.PENDING, label: "Pending" },
  { value: FOLLOW_UP_STATUS.CONTACTED, label: "Contacted" },
  { value: FOLLOW_UP_STATUS.VISITED, label: "Visited" },
  { value: FOLLOW_UP_STATUS.RESOLVED, label: "Resolved" },
  { value: FOLLOW_UP_STATUS.NO_RESPONSE, label: "No Response" },
] as const;

export const serviceTypeOptions = [
  { value: SERVICE_TYPE.SERVICE, label: "Service" },
  { value: SERVICE_TYPE.MIDWEEK, label: "Midweek" },
  { value: SERVICE_TYPE.EVENT, label: "Event" },
  { value: SERVICE_TYPE.MEETING, label: "Meeting" },
] as const;

export const attendanceStatusLabels: Record<AttendanceStatus, string> = Object.fromEntries(
  attendanceStatusOptions.map(option => [option.value, option.label])
) as Record<AttendanceStatus, string>;

export const followUpStatusLabels: Record<FollowUpStatus, string> = Object.fromEntries(
  followUpStatusOptions.map(option => [option.value, option.label])
) as Record<FollowUpStatus, string>;
