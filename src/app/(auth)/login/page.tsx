"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2, Phone, RotateCcw, UserPlus } from "lucide-react";
import { useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_ACTION } from "@/lib/authActions";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const resetFeedback = () => {
    setError("");
    setProfileMissing(false);
  };

  const handleMemberSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: AUTH_ACTION.MEMBER_LOGIN,
          phone_number: phoneNumber.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        router.push("/profile");
        router.refresh();
        return;
      }

      if (response.status === 404 || data.code === "member_not_found") {
        setProfileMissing(true);
      } else {
        setError(data.error || "We could not sign you in. Please check the number and try again.");
      }
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      variant="member"
      eyebrow="Member access"
      title="Welcome back"
      description="Sign in with the phone number on your church profile."
    >
      <form onSubmit={handleMemberSubmit} className="space-y-5">
        <AuthField
          id="phone"
          label="Phone number"
          icon={Phone}
          hint="Use the same number you registered with the church."
        >
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phoneNumber}
            onChange={event => {
              setPhoneNumber(event.target.value);
              if (error || profileMissing) resetFeedback();
            }}
            placeholder="0803 123 4567"
            required
            autoFocus
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "member-login-error" : undefined}
            className="h-12 border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] pl-10 text-base shadow-none"
          />
        </AuthField>

        {profileMissing ? (
          <div className="rounded-lg border border-[#ffb95f]/55 bg-[#fff7ed] p-4" aria-live="polite">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ffddb8] text-[#653e00]">
                <UserPlus className="size-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-[var(--font-manrope)] text-base font-semibold text-foreground">
                  No profile found yet
                </h2>
                <p className="mt-1 text-sm leading-5 text-[var(--on-surface-variant)]">
                  Create your member profile with this number to continue.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Button asChild size="lg" className="w-full shadow-none">
                <Link href={`/register?phone=${encodeURIComponent(phoneNumber.trim())}`}>
                  Create my profile
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-[var(--on-surface-variant)] shadow-none"
                onClick={() => {
                  setPhoneNumber("");
                  resetFeedback();
                }}
              >
                <RotateCcw />
                Use a different number
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="submit"
            size="lg"
            disabled={loading || !phoneNumber.trim()}
            className="w-full shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Checking your profile...
              </>
            ) : (
              <>
                Continue
                <ArrowRight />
              </>
            )}
          </Button>
        )}

        {error ? (
          <Alert id="member-login-error" variant="destructive" role="alert" className="border-destructive/35 bg-[#fff5f4]">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </form>
    </AuthShell>
  );
}
