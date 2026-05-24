import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";

const FALLBACK_MESSAGES = [
  { id: "fallback-1", message: "May the Lord continue to bless you and keep you. May His face shine upon you and give you peace throughout this new year." },
  { id: "fallback-2", message: "Wishing you a wonderful birthday filled with God's grace and blessings. May this new year of your life be filled with joy, peace, and abundant love!" },
  { id: "fallback-3", message: "On your special day, we celebrate the gift you are to our church family. May God's blessings overflow in your life today and always!" },
  { id: "fallback-4", message: "Rejoice, for this is the day the Lord has made! Happy Birthday! May you be blessed with good health, happiness, and divine favor." },
  { id: "fallback-5", message: "Happy Birthday! As you mark another year of God's faithfulness, may you continue to grow in grace and in the knowledge of our Lord Jesus Christ." }
];

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("birthday_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      if (error.code === "42P01" || error.message?.includes("relation")) {
        return NextResponse.json({ data: FALLBACK_MESSAGES, isFallback: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, isFallback: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("birthday_messages")
      .insert({ message: message.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === "42P01" || error.message?.includes("relation")) {
        return NextResponse.json({ 
          error: "Database table 'birthday_messages' does not exist. Please run the SQL editor script in SUPABASE_SETUP.md first." 
        }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
