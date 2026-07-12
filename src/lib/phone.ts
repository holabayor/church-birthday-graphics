/**
 * Normalizes a phone number to standard 11 digits (Nigerian format).
 * E.g., "+234 803 123 4567", "2348031234567", "8031234567" all become "08031234567".
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  // Strip all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  // If starts with 234 and length is greater than 10, strip the country code
  if (cleaned.startsWith("234") && cleaned.length > 10) {
    cleaned = cleaned.substring(3);
  }
  // If it is 10 digits (missing leading 0), prepend 0
  if (cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}
