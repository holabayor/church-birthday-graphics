import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { cacheKeys, getCached, invalidateCache } from "@/lib/serverCache";

export async function GET() {
  const cookieStore = await cookies();
  const signedInMemberId = cookieStore.get("member_id")?.value;
  if (!signedInMemberId) {
    const { allowed } = await requirePermission(PERMISSION.MEMBERS_VIEW);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createClient(cookieStore);

  try {
    const { hit, value } = await getCached(cacheKeys.units, 120, async () => {
      const { data, error } = await supabase.from("church_units").select("*").order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return { data: data || [] };
    });

    return NextResponse.json(value, { headers: { "X-App-Cache": hit ? "HIT" : "MISS" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { allowed } = await requirePermission(PERMISSION.UNITS_MANAGE);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Unit name is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("church_units")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateCache(cacheKeys.units);
  invalidateCache(cacheKeys.unitsManagement);
  return NextResponse.json(data, { status: 201 });
}
