"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Phone, ShieldCheck, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setProfileMissing(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "member-login", phone_number: phoneNumber }),
      });

      if (res.ok) {
        router.push("/profile");
        router.refresh();
      } else {
        const data = await res.json();
        if (res.status === 404 || data.code === "member_not_found") {
          setProfileMissing(true);
          setError("");
        } else {
          setError(data.error || "Invalid phone number");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4 relative">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-lg border-muted/60 relative z-10">
        <CardHeader className="space-y-3 text-center pb-4 pt-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2 ring-1 ring-primary/20">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">Member Sign In</CardTitle>
            <CardDescription className="text-base">Access your church profile</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleMemberSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="08031234567"
                  required
                  autoFocus
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the phone number registered with the church.
              </p>
            </div>

            {profileMissing && (
              <Alert className="py-3">
                <UserPlus className="h-4 w-4" />
                <AlertDescription className="space-y-3 text-sm">
                  <p>
                    We could not find a profile for this phone number. Would you like to create your member profile now?
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/register?phone=${encodeURIComponent(phoneNumber.trim())}`}>
                      Create My Profile
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="py-3">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full py-6 text-base shadow-sm mt-4">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Access My Profile"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 justify-center pb-8 border-t border-muted/50 pt-4 bg-muted/10">
          <p className="text-xs text-muted-foreground text-center">Secured member access</p>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/admin/login">
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              Admin sign in
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
