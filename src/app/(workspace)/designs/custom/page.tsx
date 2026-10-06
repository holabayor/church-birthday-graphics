"use client";

import { PageHeader } from "@/components/page-header";
import { CustomCardBuilder } from "@/components/birthdays/custom-card-builder";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CustomCardPage() {
  return (
    <div className="flex-1 w-full bg-[var(--background)] min-h-screen">
      <PageHeader
        eyebrow="Birthday Studio"
        title="Custom Birthday Card Creator"
        description="Design and download custom high-res birthday cards for non-database celebrants, partners, and guest ministers."
        meta={
          <div className="flex items-center gap-2 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-3 py-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground">Non-DB & Partner Studio</span>
          </div>
        }
        actions={
          <Link href="/designs">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Birthday Hub
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-8">
        <CustomCardBuilder />
      </div>
    </div>
  );
}
