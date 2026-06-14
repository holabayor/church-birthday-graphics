import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { attachMemberProfiles } from "@/lib/memberProfiles";
import { attachMemberUnits } from "@/lib/memberUnits";
import { flattenMemberForCsv, stringifyCsv } from "@/lib/memberCsv";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";

export async function GET() {
  const { allowed } = await requirePermission(PERMISSION.MEMBERS_VIEW);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("first_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const membersWithProfiles = await attachMemberProfiles(supabase, data || []);
  const membersWithUnits = await attachMemberUnits(supabase, membersWithProfiles);
  const csv = stringifyCsv(membersWithUnits.map(flattenMemberForCsv));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="members-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
