import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { MEMBERSHIP_STATUS } from "@/lib/memberLifecycle";
import { cacheKeys, getCached } from "@/lib/serverCache";

import { attachMemberUnits } from "@/lib/memberUnits";

export async function GET() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const cacheResult = await getCached(cacheKeys.birthdaysToday, 60, async () => {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("membership_status", MEMBERSHIP_STATUS.ACTIVE)
      .eq("birth_month", month)
      .eq("birth_day", day);

    if (error) throw new Error(error.message);
    const dataWithUnits = await attachMemberUnits(supabase, data || []);
    return dataWithUnits;
  });

  if (!cacheResult.hit && (cacheResult.value as any)?.error) {
    return NextResponse.json({ error: (cacheResult.value as any).error }, { status: 500 });
  }

  return NextResponse.json(cacheResult.value);
}
