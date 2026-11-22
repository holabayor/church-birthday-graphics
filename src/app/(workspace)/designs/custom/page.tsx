import { redirect } from "next/navigation";

export default function CustomCardRedirectPage() {
  redirect("/designs?tab=custom-card");
}
