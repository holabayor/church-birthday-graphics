import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { designs, defaultMessages } from "@/lib/designs";

// This endpoint can be called by a cron job (e.g., Vercel Cron) daily
// It checks today's birthdays, generates a random design, and logs it
// WhatsApp integration requires WHATSAPP_TOKEN and WHATSAPP_PHONE_ID env vars

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Simple auth check for cron jobs
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: members, error } = await supabase.from("members").select("*").eq("is_active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const birthdayMembers = (members || []).filter(m => {
    const dob = new Date(m.date_of_birth);
    return dob.getMonth() + 1 === month && dob.getDate() === day;
  });

  // Load dynamic messages or use static defaultMessages fallback
  let activeMessages = defaultMessages;
  try {
    const { data: dbMessages } = await supabase
      .from("birthday_messages")
      .select("message")
      .order("created_at", { ascending: true });

    if (dbMessages && dbMessages.length > 0) {
      activeMessages = dbMessages.map(m => m.message);
    }
  } catch (err) {
    console.error("Failed to load birthday messages from DB, using fallback:", err);
  }

  const results = [];

  for (const member of birthdayMembers) {
    const designIndex = Math.floor(Math.random() * designs.length);
    const messageIndex = Math.floor(Math.random() * activeMessages.length);
    const message = activeMessages[messageIndex];

    // Log to DB and capture the inserted row's id
    const { data: logRow } = await supabase
      .from("birthday_logs")
      .insert({
        member_id: member.id,
        design_variant: designIndex,
        status: "generated",
      })
      .select("id")
      .single();

    // Generate the image URL
    const params = new URLSearchParams({
      design: designIndex.toString(),
      first_name: member.first_name,
      middle_name: member.middle_name || "",
      last_name: member.last_name,
      position: member.position || "",
      date_of_birth: member.date_of_birth,
      message,
    });
    if (member.photo_url) {
      params.append("photo_url", member.photo_url);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const imageUrl = `${baseUrl}/api/generate?${params.toString()}`;

    // Send to WhatsApp if configured
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;
    const whatsappGroupId = process.env.WHATSAPP_GROUP_ID;

    if (whatsappToken && whatsappPhoneId && whatsappGroupId) {
      try {
        await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: whatsappGroupId,
            type: "image",
            image: { link: imageUrl, caption: `Happy Birthday ${member.first_name} ${member.last_name}! 🎉` },
          }),
        });

        // Update the specific log entry using its id
        if (logRow?.id) {
          await supabase.from("birthday_logs").update({ status: "sent", image_url: imageUrl }).eq("id", logRow.id);
        }
      } catch {
        // WhatsApp send failed, log will remain as "generated"
      }
    }

    results.push({
      member: `${member.first_name} ${member.last_name}`,
      design: designs[designIndex].name,
      imageUrl,
    });
  }

  return NextResponse.json({
    date: today.toISOString().split("T")[0],
    birthdayCount: birthdayMembers.length,
    results,
  });
}
