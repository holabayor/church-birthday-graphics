import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";

export async function GET() {
  const cookieStore = await cookies();
  const signedInMemberId = cookieStore.get("member_id")?.value;
  if (!signedInMemberId) {
    const { allowed } = await requirePermission("members.view");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.from("church_units").select("*").order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

export async function POST(req: NextRequest) {
  const { allowed } = await requirePermission("units.manage");
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
  return NextResponse.json(data, { status: 201 });
}
