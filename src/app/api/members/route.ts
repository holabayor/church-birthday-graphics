import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "first_name";
  const order = searchParams.get("order") || "asc";
  const month = searchParams.get("month") || "";
  const monthNumber = month ? parseInt(month, 10) : NaN;
  const hasMonthFilter = Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase.from("members").select("*", { count: "exact" }).order(sort, { ascending: order === "asc" });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,position.ilike.%${search}%`);
  }

  if (hasMonthFilter) {
    const { data, error } = await query.range(0, 9999);

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const filtered = (data || []).filter(member => {
      const birthMonth = parseInt(String(member.date_of_birth).split("-")[1] || "", 10);
      return birthMonth === monthNumber;
    });

    return NextResponse.json({
      data: filtered.slice(from, to + 1),
      total: filtered.length,
      page,
      limit,
    });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Supabase query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data, total: count || 0, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { first_name, middle_name, last_name, phone_number, email, date_of_birth, position, photo_url } = body;

  if (!first_name || !last_name || !date_of_birth) {
    return NextResponse.json({ error: "First name, last name, and date of birth are required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("members")
    .insert({
      first_name,
      middle_name: middle_name || null,
      last_name,
      phone_number: phone_number || null,
      email: email || null,
      date_of_birth,
      position: position || null,
      photo_url: photo_url || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
