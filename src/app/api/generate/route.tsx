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
// Fonts - loaded once from the local public directory (no network round-trip)
// ---------------------------------------------------------------------------
interface FontsCache {
  inter: ArrayBuffer;
  cinzelRegular: ArrayBuffer;
  cinzelBold: ArrayBuffer;
  montserratRegular: ArrayBuffer;
  montserratBold: ArrayBuffer;
}

let fontsCache: FontsCache | null = null;

function loadFonts(): FontsCache {
  if (fontsCache) return fontsCache;
  
  const loadFile = (filename: string) => {
    const filePath = path.join(process.cwd(), "public", filename);
    return fs.readFileSync(filePath).buffer as ArrayBuffer;
  };

  fontsCache = {
    inter: loadFile("inter-regular.ttf"),
    cinzelRegular: loadFile("Cinzel-Regular.ttf"),
    cinzelBold: loadFile("Cinzel-Bold.ttf"),
    montserratRegular: loadFile("Montserrat-Regular.ttf"),
    montserratBold: loadFile("Montserrat-Bold.ttf"),
  };
  
  return fontsCache;
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

// Helper to resolve local filesystem image paths to base64 for Satori
function resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  const trimmed = photoUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/")) {
    try {
      const relativePath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
      const localPath = path.join(process.cwd(), "public", relativePath);
      if (fs.existsSync(localPath)) {
        const fileBuffer = fs.readFileSync(localPath);
        const ext = path.extname(localPath).toLowerCase();
        const mime =
          ext === ".png"
            ? "image/png"
            : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".webp"
            ? "image/webp"
            : "image/png";
        return `data:${mime};base64,${fileBuffer.toString("base64")}`;
      }
    } catch (err) {
      console.warn("Failed to resolve local photo file to base64:", err);
    }
  }

  return trimmed;
}

// ---------------------------------------------------------------------------
// Main Render Handler
// ---------------------------------------------------------------------------
async function generateCardPng(params: {
  designIndex: number;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  position: string;
  dob: string;
  photoUrl: string | null;
  message: string;
  unitName: string;
  unitRole: string;
}) {
  const resolvedPhoto = resolvePhotoUrl(params.photoUrl);

  const member: Member = {
    id: "",
    title: params.title || null,
    first_name: params.firstName,
    middle_name: params.middleName || null,
    last_name: params.lastName,
    date_of_birth: params.dob,
    position: params.position || null,
    photo_url: resolvedPhoto,
    is_active: true,
    created_at: "",
    updated_at: "",
    units: params.unitName
      ? [
          {
            id: "",
            name: params.unitName,
            description: null,
            created_at: "",
            updated_at: "",
            role: params.unitRole as any,
          },
        ]
      : [],
  };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [fonts, churchLogoUrl] = await Promise.all([Promise.resolve(loadFonts()), getChurchLogoUrl(supabase)]);

  const design = designs[params.designIndex % designs.length];
  const element = design.render({ member, message: params.message, churchLogoUrl });

  const svg = await satori(element, {
    width: 1080,
    height: 1080,
    fonts: [
      { name: "sans-serif", data: fonts.inter, weight: 400, style: "normal" },
      { name: "Cinzel", data: fonts.cinzelRegular, weight: 400, style: "normal" },
      { name: "Cinzel", data: fonts.cinzelBold, weight: 700, style: "normal" },
      { name: "Montserrat", data: fonts.montserratRegular, weight: 400, style: "normal" },
      { name: "Montserrat", data: fonts.montserratBold, weight: 700, style: "normal" },
    ],
  });

  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 6, effort: 1 }).toBuffer();

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}

// ---------------------------------------------------------------------------
// Route Handlers (GET & POST)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    return await generateCardPng({
      designIndex: parseInt(searchParams.get("design") || "0"),
      title: searchParams.get("title") || searchParams.get("prefix") || "",
      firstName: searchParams.get("first_name") || "John",
      middleName: searchParams.get("middle_name") || "",
      lastName: searchParams.get("last_name") || "Doe",
      position: searchParams.get("position") || "",
      dob: searchParams.get("date_of_birth") || "2000-01-01",
      photoUrl: searchParams.get("photo_url"),
      message: searchParams.get("message") || defaultMessages[0],
      unitName: searchParams.get("unit_name") || "",
      unitRole: searchParams.get("unit_role") || "",
    });
  } catch (err) {
    console.error("Generate GET error:", err);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return await generateCardPng({
      designIndex: parseInt(body.design || "0"),
      title: body.title || body.prefix || "",
      firstName: body.first_name || "John",
      middleName: body.middle_name || "",
      lastName: body.last_name || "Doe",
      position: body.position || "",
      dob: body.date_of_birth || "2000-01-01",
      photoUrl: body.photo_url || null,
      message: body.message || defaultMessages[0],
      unitName: body.unit_name || "",
      unitRole: body.unit_role || "",
    });
  } catch (err) {
    console.error("Generate POST error:", err);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
