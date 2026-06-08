import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Sign In - Church Birthday Graphics",
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
