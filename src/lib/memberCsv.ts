import { normalizeUnitRole, UNIT_ROLE } from "@/lib/unitRoles";

export const memberCsvColumns = [
  "first_name",
  "middle_name",
  "last_name",
  "phone_number",
  "email",
  "date_of_birth",
  "position",
  "life_stage",
  "membership_status",
  "institution",
  "department",
  "academic_level",
  "student_status",
  "residence",
  "cell_group",
  "nysc_state",
  "nysc_ppa",
  "employer",
  "job_title",
  "work_location",
  "graduation_year",
  "guardian_name",
  "guardian_phone",
  "skills_interests",
  "units",
];

const escapeCsvValue = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const stringifyCsv = (rows: Record<string, unknown>[]) => {
  const lines = [
    memberCsvColumns.map(escapeCsvValue).join(","),
    ...rows.map(row => memberCsvColumns.map(column => escapeCsvValue(row[column])).join(",")),
  ];
  return lines.join("\r\n");
};

export const flattenMemberForCsv = (member: any) => ({
  ...member,
  units: (member.units || []).map((unit: any) => `${unit.name}:${unit.role}`).join("; "),
});

export const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current.trim());
      if (row.some(value => value.length > 0)) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  if (row.some(value => value.length > 0)) rows.push(row);

  if (rows.length === 0) return [];

  const headers = rows[0].map(header => header.trim());
  return rows.slice(1).map(values =>
    Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""]))
  );
};

export const parseUnitsCsvValue = (value: string) =>
  value
    .split(";")
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [name, role = UNIT_ROLE.MEMBER] = part.split(":").map(item => item.trim());
      return { name, role: normalizeUnitRole(role) };
    })
    .filter(unit => unit.name);
