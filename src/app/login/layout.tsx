import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Church Birthday Graphics",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
