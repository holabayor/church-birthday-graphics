import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { MEMBERSHIP_STATUS } from "@/lib/memberLifecycle";
import { cacheKeys, getCached } from "@/lib/serverCache";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7); // Next 7 days
  endOfWeek.setHours(23, 59, 59, 999);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const cacheResult = await getCached(cacheKeys.birthdaysWeek, 60, async () => {
    const currentMonth = today.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("membership_status", MEMBERSHIP_STATUS.ACTIVE)
      .in("birth_month", [currentMonth, nextMonth]);

    if (error) throw new Error(error.message);

    const weekMembers = (data || []).filter(m => {
      const dob = new Date(m.date_of_birth);
      const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      
      if (birthdayThisYear < today) {
        birthdayThisYear.setFullYear(today.getFullYear() + 1);
      }
      
      return birthdayThisYear >= today && birthdayThisYear <= endOfWeek;
    });

    weekMembers.sort((a, b) => {
      const dobA = new Date(a.date_of_birth);
      const dobB = new Date(b.date_of_birth);
      const bdayA = new Date(today.getFullYear(), dobA.getMonth(), dobA.getDate());
      const bdayB = new Date(today.getFullYear(), dobB.getMonth(), dobB.getDate());
      
      if (bdayA < today) bdayA.setFullYear(today.getFullYear() + 1);
      if (bdayB < today) bdayB.setFullYear(today.getFullYear() + 1);
      
      return bdayA.getTime() - bdayB.getTime();
    });

    return weekMembers;
  });

  if (!cacheResult.hit && (cacheResult.value as any)?.error) {
    return NextResponse.json({ error: (cacheResult.value as any).error }, { status: 500 });
  }

  return NextResponse.json(cacheResult.value);
}
