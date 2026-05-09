import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Member } from "./types";

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
