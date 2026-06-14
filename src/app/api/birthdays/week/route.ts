import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { MEMBERSHIP_STATUS } from "@/lib/memberLifecycle";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7); // Next 7 days
  endOfWeek.setHours(23, 59, 59, 999);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.from("members").select("*").eq("membership_status", MEMBERSHIP_STATUS.ACTIVE);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const weekMembers = (data || []).filter(m => {
    const dob = new Date(m.date_of_birth);
    // Determine the birthday date for the current year
    const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    
    // If the birthday this year has already passed, check next year
    if (birthdayThisYear < today) {
      birthdayThisYear.setFullYear(today.getFullYear() + 1);
    }
    
    return birthdayThisYear >= today && birthdayThisYear <= endOfWeek;
  });

  // Sort them so the closest birthday is first
  weekMembers.sort((a, b) => {
    const dobA = new Date(a.date_of_birth);
    const dobB = new Date(b.date_of_birth);
    const bdayA = new Date(today.getFullYear(), dobA.getMonth(), dobA.getDate());
    const bdayB = new Date(today.getFullYear(), dobB.getMonth(), dobB.getDate());
    
    if (bdayA < today) bdayA.setFullYear(today.getFullYear() + 1);
    if (bdayB < today) bdayB.setFullYear(today.getFullYear() + 1);
    
    return bdayA.getTime() - bdayB.getTime();
  });

  return NextResponse.json(weekMembers);
}
