import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";

export async function GET() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.from("members").select("*").eq("is_active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const birthdayMembers = (data || []).filter(m => {
    const dob = new Date(m.date_of_birth);
    return dob.getMonth() + 1 === month && dob.getDate() === day;
  });

  return NextResponse.json(birthdayMembers);
}
