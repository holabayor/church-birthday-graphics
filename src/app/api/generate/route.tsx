import { NextRequest, NextResponse } from "next/server";
import satori from "satori";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { createClient } from "@/lib/server";
import { cookies } from "next/headers";
import { designs, defaultMessages } from "@/lib/designs";
import { Member } from "@/lib/types";
import { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Font - loaded once from the local public directory (no network round-trip)
// ---------------------------------------------------------------------------
let fontCache: ArrayBuffer | null = null;

function loadFont(): ArrayBuffer {
  if (fontCache) return fontCache;
  const fontPath = path.join(process.cwd(), "public", "inter-regular.ttf");
  fontCache = fs.readFileSync(fontPath).buffer as ArrayBuffer;
  return fontCache;
}

// ---------------------------------------------------------------------------
// Church logo - cached in memory with a 5-minute TTL
// ---------------------------------------------------------------------------
let logoCache: { url: string | undefined; expiresAt: number } | null = null;
const LOGO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getChurchLogoUrl(supabase: SupabaseClient): Promise<string | undefined> {
  const now = Date.now();
  if (logoCache && now < logoCache.expiresAt) {
    return logoCache.url;
  }
  const { data: settings } = await supabase.from("church_settings").select("logo_url").single();
  const url = settings?.logo_url || undefined;
  logoCache = { url, expiresAt: now + LOGO_CACHE_TTL_MS };
  return url;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const designIndex = parseInt(searchParams.get("design") || "0");
    const firstName = searchParams.get("first_name") || "John";
    const middleName = searchParams.get("middle_name") || "";
    const lastName = searchParams.get("last_name") || "Doe";
    const position = searchParams.get("position") || "";
    const dob = searchParams.get("date_of_birth") || "2000-01-01";
    const photoUrl = searchParams.get("photo_url");
    const message = searchParams.get("message") || defaultMessages[0];
    const unitName = searchParams.get("unit_name") || "";
    const unitRole = searchParams.get("unit_role") || "";

    const member: Member = {
      id: "",
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      date_of_birth: dob,
      position: position || null,
      photo_url: photoUrl || null,
      is_active: true,
      created_at: "",
      updated_at: "",
      units: unitName ? [{
        id: "",
        name: unitName,
        description: null,
        created_at: "",
        updated_at: "",
        role: unitRole as any,
      }] : [],
    };

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Run font load and logo fetch concurrently
    const [fontData, churchLogoUrl] = await Promise.all([Promise.resolve(loadFont()), getChurchLogoUrl(supabase)]);

    const design = designs[designIndex % designs.length];
    const element = design.render({ member, message, churchLogoUrl });

    const svg = await satori(element, {
      width: 1080,
      height: 1080,
      fonts: [{ name: "sans-serif", data: fontData, weight: 400, style: "normal" }],
    });

    // compressionLevel 6 + effort 1 = fast encode, good size balance
    const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 6, effort: 1 }).toBuffer();

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
