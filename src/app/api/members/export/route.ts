import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { attachMemberProfiles } from "@/lib/memberProfiles";
import { attachMemberUnits } from "@/lib/memberUnits";
import { flattenMemberForCsv, stringifyCsv } from "@/lib/memberCsv";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { FILTER_VALUE } from "@/lib/filterOptions";
import { normalizeLifeStage } from "@/lib/memberLifecycle";

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const { allowed } = await requirePermission(PERMISSION.MEMBERS_VIEW);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const searchParams = req.nextUrl.searchParams;
  const format = searchParams.get("format") || "full"; // "summary" | "full"
  const workersOnly = searchParams.get("workers_only") === "true";
  const unitId = searchParams.get("unit_id") || "";
  const lifeStage = searchParams.get("life_stage") || "";
  const month = searchParams.get("month") || "";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase.from("members").select("*").order("first_name", { ascending: true });

  if (lifeStage && lifeStage !== FILTER_VALUE.ALL && lifeStage !== "workers") {
    query = query.eq("life_stage", normalizeLifeStage(lifeStage));
  }

  const monthNumber = month ? parseInt(month, 10) : NaN;
  if (Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
    query = query.eq("birth_month", monthNumber);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const membersWithProfiles = await attachMemberProfiles(supabase, data || []);
  let membersWithUnits = await attachMemberUnits(supabase, membersWithProfiles);

  if (unitId && unitId !== FILTER_VALUE.ALL) {
    membersWithUnits = membersWithUnits.filter((m: any) =>
      (m.units || []).some((u: any) => u.id === unitId)
    );
  }

  if (workersOnly || lifeStage === "workers") {
    membersWithUnits = membersWithUnits.filter((m: any) => {
      const hasUnits = Array.isArray(m.units) && m.units.length > 0;
      const hasPosition = Boolean(m.position && String(m.position).trim());
      const isWorkerType = m.member_type === "worker";
      return hasUnits || hasPosition || isWorkerType;
    });
  }

  const dateStamp = new Date().toISOString().slice(0, 10);

  if (format === "summary") {
    const rows: string[] = [];
    rows.push(["Full Name", "Phone Number", "Worker Flag", "Position"].join(","));

    for (const m of membersWithUnits as any[]) {
      const fullName = [m.first_name, m.middle_name, m.last_name]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const unitsList = (m.units || []).map((u: any) => {
        const roleLabel = u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Member";
        return `${u.name} (${roleLabel})`;
      });

      const isWorker =
        m.member_type === "worker" ||
        unitsList.length > 0 ||
        Boolean(m.position && String(m.position).trim())
          ? "Yes"
          : "No";

      const posParts: string[] = [];
      if (m.position && String(m.position).trim()) {
        posParts.push(String(m.position).trim());
      }
      if (unitsList.length > 0) {
        posParts.push(unitsList.join("; "));
      }
      const position = posParts.join(" - ");
      const phone = m.phone_number ? String(m.phone_number).trim() : "";

      rows.push(
        [
          escapeCsvCell(fullName),
          escapeCsvCell(phone),
          escapeCsvCell(isWorker),
          escapeCsvCell(position),
        ].join(",")
      );
    }

    const csv = rows.join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="church-users-summary-${dateStamp}.csv"`,
      },
    });
  }

  const csv = stringifyCsv(membersWithUnits.map(flattenMemberForCsv));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="members-directory-full-${dateStamp}.csv"`,
    },
  });
}
