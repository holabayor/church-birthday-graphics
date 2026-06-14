import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin Sign In | Kinship",
  description: "Restricted sign-in for Kinship super administrators.",
};

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
