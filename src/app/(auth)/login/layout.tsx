import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Sign In | Kinship",
  description: "Sign in to access your church member profile.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
