import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/adminPermissions";
import { PERMISSION } from "@/lib/adminRoles";
import { cacheKeys, getCached, invalidateCache } from "@/lib/serverCache";

export async function GET() {
  try {
    const { hit, value } = await getCached(cacheKeys.churchSettings, 300, async () => {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const { data, error } = await supabase.from("church_settings").select("*").limit(1).maybeSingle();

      if (error) throw new Error(error.message);
      return data || { church_name: "", church_address: "", logo_url: null };
    });

    return NextResponse.json(value, { headers: { "X-App-Cache": hit ? "HIT" : "MISS" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { allowed } = await requirePermission(PERMISSION.SETTINGS_MANAGE);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { church_name, church_address, logo_url } = body;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: existing, error: fetchError } = await supabase.from("church_settings").select("id").limit(1).maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!existing) {
    const { data, error } = await supabase
      .from("church_settings")
      .insert({ church_name, church_address, logo_url })
      .select()
      .single();

    if (error) {
      console.log("Error from inserting data", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    invalidateCache(cacheKeys.churchSettings);
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("church_settings")
    .update({ church_name, church_address, logo_url, updated_at: new Date().toISOString() })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    console.log("Error from updating data", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  invalidateCache(cacheKeys.churchSettings);
  return NextResponse.json(data);
}
