import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "avatars";
    const folder = (formData.get("folder") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = `${folder ? folder + "/" : ""}${safeFilename}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Attempt Supabase Storage upload first if available & configured
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

      if (!error && data) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (urlData?.publicUrl) {
          return NextResponse.json({ url: urlData.publicUrl });
        }
      }
    } catch (supaErr) {
      console.warn("Supabase storage upload bypassed/failed, saving locally:", supaErr);
    }

    // Fallback: Save file to local public/uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(localFilePath, buffer);

    const publicUrl = `/uploads/${folder ? folder + "/" : ""}${safeFilename}`;
    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error("Failed to upload image:", err);
    return NextResponse.json({ error: err.message || "Failed to upload image" }, { status: 500 });
  }
}
