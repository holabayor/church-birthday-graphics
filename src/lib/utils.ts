import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Member } from "./types";
import { BookOpen, Users, Music, Video, UserPlus, Heart, Shield, type LucideIcon } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFullName(m: Member) {
  return [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(" ");
}

export function getBirthDate(m: Member) {
  const d = new Date(m.date_of_birth);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function compressImage(file: File, maxW = 1200, maxH = 1200, quality = 0.8): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  if (file.size < 300 * 1024) {
    return file;
  }

  return new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxW || height > maxH) {
          if (width > height) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          } else {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        canvas.toBlob(
          blob => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name, {
                type: outputType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          outputType,
          quality,
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export function slugify(text: string): string {
  const base = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export function getUnitIcon(unitName: string): LucideIcon {
  const name = unitName.toLowerCase();
  if (name.includes("choir") || name.includes("music") || name.includes("worship")) return Music;
  if (name.includes("media") || name.includes("tech") || name.includes("sound")) return Video;
  if (name.includes("usher") || name.includes("greeter")) return UserPlus;
  if (name.includes("mentor") || name.includes("youth") || name.includes("care") || name.includes("welfare"))
    return Heart;
  if (name.includes("security") || name.includes("protocol")) return Shield;
  if (name.includes("teach") || name.includes("sunday school") || name.includes("bible")) return BookOpen;
  return Users;
}
