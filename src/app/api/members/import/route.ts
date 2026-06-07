import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { parseCsv, parseUnitsCsvValue } from "@/lib/memberCsv";
import { saveMemberProfiles } from "@/lib/memberProfiles";
import { saveMemberUnits } from "@/lib/memberUnits";
import { requirePermission } from "@/lib/adminPermissions";

const coreFields = [
  "first_name",
  "middle_name",
  "last_name",
  "phone_number",
  "email",
  "date_of_birth",
  "position",
  "member_type",
];

const profileFields = [
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
];

const cleanValue = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
};

const normalizeDate = (value: unknown) => {
  const text = cleanValue(value);
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toISOString().slice(0, 10);
};

export async function POST(req: NextRequest) {
  const { allowed } = await requirePermission("members.manage");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  const rows = parseCsv(await file.text());
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: units, error: unitsError } = await supabase
    .from("church_units")
    .select("id, name");

  if (unitsError) return NextResponse.json({ error: unitsError.message }, { status: 500 });

  const unitIdsByName = new Map((units || []).map(unit => [String(unit.name).toLowerCase(), unit.id]));
  const summary = {
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const firstName = cleanValue(row.first_name);
    const lastName = cleanValue(row.last_name);
    const dateOfBirth = normalizeDate(row.date_of_birth);

    if (!firstName || !lastName || !dateOfBirth) {
      summary.failed += 1;
      summary.errors.push(`Row ${rowNumber}: first_name, last_name, and date_of_birth are required.`);
      continue;
    }

    const phone = cleanValue(row.phone_number);
    const email = cleanValue(row.email);

    if (phone || email) {
      let duplicateQuery = supabase.from("members").select("id").limit(1);
      if (phone && email) duplicateQuery = duplicateQuery.or(`phone_number.eq.${phone},email.eq.${email}`);
      if (phone && !email) duplicateQuery = duplicateQuery.eq("phone_number", phone);
      if (!phone && email) duplicateQuery = duplicateQuery.eq("email", email);

      const { data: duplicate, error: duplicateError } = await duplicateQuery.maybeSingle();
      if (duplicateError) {
        summary.failed += 1;
        summary.errors.push(`Row ${rowNumber}: duplicate check failed (${duplicateError.message}).`);
        continue;
      }

      if (duplicate) {
        summary.skipped += 1;
        continue;
      }
    }

    const memberPayload = Object.fromEntries(
      coreFields.map(field => [
        field,
        field === "date_of_birth"
          ? dateOfBirth
          : field === "member_type"
            ? cleanValue(row[field]) || "member"
            : cleanValue(row[field]),
      ])
    );

    const { data: member, error: memberError } = await supabase
      .from("members")
      .insert(memberPayload)
      .select()
      .single();

    if (memberError) {
      summary.failed += 1;
      summary.errors.push(`Row ${rowNumber}: ${memberError.message}`);
      continue;
    }

    const profilePayload = Object.fromEntries(profileFields.map(field => [field, cleanValue(row[field])]));
    const profileError = await saveMemberProfiles(supabase, member.id, {
      member_type: memberPayload.member_type,
      ...profilePayload,
    });

    if (profileError) {
      summary.failed += 1;
      summary.errors.push(`Row ${rowNumber}: profile save failed (${profileError.message}).`);
      continue;
    }

    const parsedUnits = parseUnitsCsvValue(String(row.units || ""));
    if (parsedUnits.length > 0) {
      const unitAssignments = parsedUnits
        .map(unit => ({
          unit_id: unitIdsByName.get(unit.name.toLowerCase()),
          role: unit.role as "member" | "assistant" | "head",
        }))
        .filter((unit): unit is { unit_id: string; role: "member" | "assistant" | "head" } => Boolean(unit.unit_id));

      const unitsError = await saveMemberUnits(supabase, member.id, unitAssignments);
      if (unitsError) {
        summary.failed += 1;
        summary.errors.push(`Row ${rowNumber}: unit assignment failed (${unitsError.message}).`);
        continue;
      }
    }

    summary.created += 1;
  }

  return NextResponse.json(summary);
}
