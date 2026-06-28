import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { MEMBERSHIP_STATUS } from "@/lib/memberLifecycle";

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

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("membership_status", MEMBERSHIP_STATUS.ACTIVE);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const startYear = startDate.getFullYear();

  const filtered = (data || []).filter(member => {
    const dob = new Date(member.date_of_birth);
    if (isNaN(dob.getTime())) return false;

    const bMonth = dob.getMonth();
    const bDay = dob.getDate();

    // Member's birthday in the starting date's year
    const bDate = new Date(startYear, bMonth, bDay);
    
    // Normalize comparison dates
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

  // Sort by birthday order (month and day)
  filtered.sort((a, b) => {
    const dobA = new Date(a.date_of_birth);
    const dobB = new Date(b.date_of_birth);
    
    const bdayA = new Date(startYear, dobA.getMonth(), dobA.getDate());
    const bdayB = new Date(startYear, dobB.getMonth(), dobB.getDate());
    
    if (bdayA < startDate) bdayA.setFullYear(startYear + 1);
    if (bdayB < startDate) bdayB.setFullYear(startYear + 1);
    
    return bdayA.getTime() - bdayB.getTime();
  });

  return NextResponse.json(filtered);
}
