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

    // 1. Primary Option: Attempt Supabase Storage upload if configured
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
      console.warn("Supabase storage upload bypassed/failed, trying local storage:", supaErr);
    }

    // 2. Secondary Option: Try local public/uploads filesystem (local Node / Docker)
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const localFilePath = path.join(uploadsDir, safeFilename);
      fs.writeFileSync(localFilePath, buffer);

      const publicUrl = `/uploads/${folder ? folder + "/" : ""}${safeFilename}`;
      return NextResponse.json({ url: publicUrl });
    } catch (fsErr) {
      console.warn("Local filesystem write unpermitted (Vercel serverless environment), returning Data URL fallback:", fsErr);
    }

    // 3. Serverless Fallback: Return Data URL for read-only environments (Vercel / AWS Lambda)
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/png";
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({ url: dataUrl });
  } catch (err: any) {
    console.error("Failed to upload image:", err);
    return NextResponse.json({ error: err.message || "Failed to upload image" }, { status: 500 });
  }
}
