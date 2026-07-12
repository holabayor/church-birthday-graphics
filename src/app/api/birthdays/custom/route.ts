import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { MEMBERSHIP_STATUS } from "@/lib/memberLifecycle";
import { cacheKeys, getCached } from "@/lib/serverCache";

function getMonthsInRange(start: Date, end: Date): number[] {
  const months = new Set<number>();
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const limit = new Date(end.getFullYear(), end.getMonth(), 1);
  
  const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (monthsDiff >= 11) {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }

  while (current <= limit) {
    months.add(current.getMonth() + 1);
    current.setMonth(current.getMonth() + 1);
  }
  months.add(end.getMonth() + 1);
  return Array.from(months);
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  if (!startStr || !endStr) {
    return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
  }

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const cacheResult = await getCached(cacheKeys.birthdaysCustom(startStr, endStr), 60, async () => {
    const monthsCovered = getMonthsInRange(startDate, endDate);

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("membership_status", MEMBERSHIP_STATUS.ACTIVE)
      .in("birth_month", monthsCovered);

    if (error) throw new Error(error.message);

    const startYear = startDate.getFullYear();

    const filtered = (data || []).filter(member => {
      const dob = new Date(member.date_of_birth);
      if (isNaN(dob.getTime())) return false;

      const bMonth = dob.getMonth();
      const bDay = dob.getDate();

      const bDate = new Date(startYear, bMonth, bDay);
      
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);

      if (eDate.getFullYear() > sDate.getFullYear()) {
        const bDateNextYear = new Date(startYear + 1, bMonth, bDay);
        return (bDate >= sDate) || (bDateNextYear <= eDate);
      }

      return bDate >= sDate && bDate <= eDate;
    });

    filtered.sort((a, b) => {
      const dobA = new Date(a.date_of_birth);
      const dobB = new Date(b.date_of_birth);
      
      const bdayA = new Date(startYear, dobA.getMonth(), dobA.getDate());
      const bdayB = new Date(startYear, dobB.getMonth(), dobB.getDate());
      
      if (bdayA < startDate) bdayA.setFullYear(startYear + 1);
      if (bdayB < startDate) bdayB.setFullYear(startYear + 1);
      
      return bdayA.getTime() - bdayB.getTime();
    });

    return filtered;
  });

  if (!cacheResult.hit && (cacheResult.value as any)?.error) {
    return NextResponse.json({ error: (cacheResult.value as any).error }, { status: 500 });
  }

  return NextResponse.json(cacheResult.value);
}
