import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const formData = await req.formData();
  const file = formData.get("file") as File;

  const bucket = formData.get("bucket") as string;
  const folder = (formData.get("folder") as string) || "";

  if (!file || !bucket) {
    return NextResponse.json({ error: "file and bucket are required" }, { status: 400 });
  }

  const filePath = `${folder ? folder + "/" : ""}${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    console.error("Failed to upload image", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return NextResponse.json({ url: urlData.publicUrl });
}
