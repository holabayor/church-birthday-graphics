"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Loader2,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUTH_ACTION } from "@/lib/authActions";
import { LIFE_STAGE, lifeStageOptions } from "@/lib/memberLifecycle";

const inputClassName =
  "h-12 border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-base shadow-none";

function RegisterLoading() {
  return (
    <AuthShell
      variant="member"
      eyebrow="Member registration"
      title="Create your member profile"
      description="We are preparing the registration form."
    >
      <div className="space-y-4" aria-label="Loading registration form">
        <div className="h-12 animate-pulse rounded-md bg-[var(--surface-container-low)]" />
        <div className="h-12 animate-pulse rounded-md bg-[var(--surface-container-low)]" />
        <div className="h-12 animate-pulse rounded-md bg-[var(--surface-container-low)]" />
      </div>
    </AuthShell>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone_number: searchParams.get("phone") || "",
    email: "",
    date_of_birth: "",
    life_stage: LIFE_STAGE.OTHER,
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: AUTH_ACTION.MEMBER_REGISTER,
          ...form,
          phone_number: form.phone_number.trim(),
          email: form.email.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "We could not create your profile. Please try again.");
      }

      toast.success(data.existing ? "Welcome back. We found your profile." : "Your profile has been created.");
      router.push("/profile");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We could not create your profile.");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = Boolean(
    form.first_name.trim() &&
      form.last_name.trim() &&
      form.phone_number.trim() &&
      form.date_of_birth,
  );

  return (
    <AuthShell
      variant="member"
      eyebrow="Member registration"
      title="Create your member profile"
      description="Start with the essentials. You can complete the rest of your details from your profile."
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-semibold text-primary hover:underline hover:underline-offset-4"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField id="first_name" label="First name" icon={UserRound}>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={event => updateField("first_name", event.target.value)}
              autoComplete="given-name"
              required
              autoFocus
              aria-invalid={Boolean(error)}
              className={`${inputClassName} pl-10`}
            />
          </AuthField>

          <AuthField id="last_name" label="Last name">
            <Input
              id="last_name"
              value={form.last_name}
              onChange={event => updateField("last_name", event.target.value)}
              autoComplete="family-name"
              required
              aria-invalid={Boolean(error)}
              className={inputClassName}
            />
          </AuthField>

          <AuthField id="middle_name" label="Middle name" optional>
            <Input
              id="middle_name"
              value={form.middle_name}
              onChange={event => updateField("middle_name", event.target.value)}
              autoComplete="additional-name"
              className={inputClassName}
            />
          </AuthField>

          <AuthField id="phone_number" label="Phone number" icon={Phone}>
            <Input
              id="phone_number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone_number}
              onChange={event => updateField("phone_number", event.target.value)}
              placeholder="0803 123 4567"
              required
              aria-invalid={Boolean(error)}
              className={`${inputClassName} pl-10`}
            />
          </AuthField>

          <AuthField id="date_of_birth" label="Date of birth" icon={CalendarDays}>
            <Input
              id="date_of_birth"
              type="date"
              autoComplete="bday"
              value={form.date_of_birth}
              onChange={event => updateField("date_of_birth", event.target.value)}
              required
              aria-invalid={Boolean(error)}
              className={`${inputClassName} pl-10`}
            />
          </AuthField>

          <AuthField id="life_stage" label="Current life stage" optional>
            <Select value={form.life_stage} onValueChange={value => updateField("life_stage", value)}>
              <SelectTrigger
                id="life_stage"
                className="h-12 w-full border-[var(--outline-variant)] bg-white text-base shadow-none"
              >
                <SelectValue placeholder="Select life stage" />
              </SelectTrigger>
              <SelectContent>
                {lifeStageOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AuthField>

          <AuthField id="email" label="Email address" icon={Mail} optional className="sm:col-span-2">
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              onChange={event => updateField("email", event.target.value)}
              placeholder="you@example.com"
              aria-invalid={Boolean(error)}
              className={`${inputClassName} pl-10`}
            />
          </AuthField>
        </div>

        {error ? (
          <Alert variant="destructive" role="alert" className="border-destructive/35 bg-[#fff5f4]">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" size="lg" disabled={saving || !canSubmit} className="w-full shadow-none">
          {saving ? (
            <>
              <Loader2 className="animate-spin" />
              Creating your profile...
            </>
          ) : (
            <>
              Create profile
              <ArrowRight />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterForm />
    </Suspense>
  );
}
