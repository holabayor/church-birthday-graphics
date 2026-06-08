import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app-shell";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { Analytics } from "@vercel/analytics/next";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kinship Management System",
  description: "Member, unit, attendance, outreach, and birthday management for a youth church",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${inter.variable} ${jetBrainsMono.variable} antialiased`}>
        <AppShell>{children}</AppShell>
        <Toaster richColors position="top-right" />
        <VisualEditsMessenger />
        <Analytics />
      </body>
    </html>
  );
}
