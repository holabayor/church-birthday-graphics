"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getAdminError(message?: string) {
  if (!message) return "We could not sign you in. Please try again.";
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }
  return message;
}

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdminSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      setError(getAdminError(data.error));
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      variant="admin"
      eyebrow="Restricted access"
      title="Super admin sign in"
      description="Use the credentials assigned to your super admin account."
      footer={<p>Access is limited to approved super administrator accounts.</p>}
    >
      <form onSubmit={handleAdminSubmit} className="space-y-5">
        <AuthField id="admin-email" label="Email address" icon={Mail}>
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={event => {
              setEmail(event.target.value);
              if (error) setError("");
            }}
            placeholder="admin@example.com"
            required
            autoFocus
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "admin-login-error" : undefined}
            className="h-12 border-[var(--outline-variant)] bg-white pl-10 text-base shadow-none"
          />
        </AuthField>

        <AuthField id="admin-password" label="Password" icon={Lock}>
          <Input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={event => {
              setPassword(event.target.value);
              if (error) setError("");
            }}
            placeholder="Enter your password"
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "admin-login-error" : undefined}
            className="h-12 border-[var(--outline-variant)] bg-white pl-10 pr-12 text-base shadow-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(value => !value)}
            className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--outline)] transition-colors hover:bg-[var(--surface-container-low)] hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </AuthField>

        {error ? (
          <Alert id="admin-login-error" variant="destructive" role="alert" className="border-destructive/35 bg-[#fff5f4]">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={loading || !email.trim() || !password}
          className="w-full shadow-none"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              Sign in securely
              <ArrowRight />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
