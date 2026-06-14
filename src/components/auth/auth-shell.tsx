"use client";

import Image from "next/image";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthVariant = "member" | "admin";

type ChurchIdentity = {
  church_name?: string | null;
  logo_url?: string | null;
};

type AuthShellProps = {
  variant: AuthVariant;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

const variantCopy: Record<AuthVariant, { label: string; statement: string }> = {
  member: {
    label: "Member community",
    statement: "Known, cared for, and connected.",
  },
  admin: {
    label: "Restricted console",
    statement: "Stewardship with clarity and care.",
  },
};

export function AuthShell({ variant, eyebrow, title, description, children, footer }: AuthShellProps) {
  const [identity, setIdentity] = useState<ChurchIdentity>({ church_name: "Kinship" });
  const isAdmin = variant === "admin";

  useEffect(() => {
    let mounted = true;

    fetch("/api/church-settings")
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (mounted && data && !data.error) setIdentity(data);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const churchName = identity.church_name?.trim() || "Kinship";
  const copy = variantCopy[variant];

  return (
    <main className="min-h-dvh bg-[var(--surface)] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
      <section className="relative min-h-[210px] overflow-hidden bg-[var(--inverse-surface)] sm:min-h-[260px] lg:min-h-dvh">
        <Image
          src="/teen.png"
          alt="A young church member standing with the congregation"
          fill
          priority
          sizes="(min-width: 1024px) 54vw, 100vw"
          className={cn(
            "object-cover object-[center_36%]",
            isAdmin && "grayscale-[35%] object-center",
          )}
        />
        <div
          className={cn(
            "absolute inset-0",
            isAdmin ? "bg-[#0b1c30]/82" : "bg-[#0b1c30]/58",
          )}
        />

        <div className="relative flex h-full min-h-[210px] flex-col justify-between px-4 py-5 text-white sm:min-h-[260px] sm:px-6 sm:py-6 lg:min-h-dvh lg:px-10 lg:py-9 xl:px-14 xl:py-12">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/25 bg-white/95 text-lg font-bold text-primary shadow-sm">
              {identity.logo_url ? (
                // Remote church logos are user-configured and may come from different hosts.
                <img src={identity.logo_url} alt="" className="size-full object-contain p-1" />
              ) : (
                churchName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.05em] text-white/70">
                {copy.label}
              </p>
              <p className="truncate font-[var(--font-manrope)] text-lg font-semibold leading-6">
                {churchName}
              </p>
            </div>
          </div>

          <div className="max-w-xl pb-1 lg:pb-4">
            <div
              className={cn(
                "mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.05em]",
                isAdmin
                  ? "border-white/20 bg-white/10 text-white/85"
                  : "border-[#ffb95f]/55 bg-[#2a1700]/35 text-[#ffddb8]",
              )}
            >
              {isAdmin ? <ShieldCheck className="size-3.5" /> : <Sparkles className="size-3.5" />}
              {isAdmin ? "Super admin access" : "Your church family"}
            </div>
            <p className="max-w-md font-[var(--font-manrope)] text-2xl font-bold leading-8 text-white sm:text-3xl sm:leading-10 lg:text-[40px] lg:leading-[48px]">
              {copy.statement}
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-[calc(100dvh-210px)] items-start bg-[var(--surface-container-lowest)] px-4 py-8 sm:min-h-[calc(100dvh-260px)] sm:px-8 sm:py-10 lg:min-h-dvh lg:items-center lg:px-12 lg:py-12 xl:px-16">
        <div className="mx-auto w-full max-w-[480px]">
          <div className="mb-7 sm:mb-8">
            <p
              className={cn(
                "mb-2 font-mono text-xs font-medium uppercase tracking-[0.05em]",
                isAdmin ? "text-[var(--outline)]" : "text-primary",
              )}
            >
              {eyebrow}
            </p>
            <h1 className="font-[var(--font-manrope)] text-2xl font-bold leading-8 text-foreground sm:text-[32px] sm:leading-10">
              {title}
            </h1>
            <p className="mt-2 max-w-md text-[15px] leading-6 text-[var(--on-surface-variant)] sm:text-base">
              {description}
            </p>
          </div>

          {children}

          {footer ? (
            <div className="mt-7 border-t border-[var(--outline-variant)]/60 pt-5 text-sm text-[var(--on-surface-variant)]">
              {footer}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

