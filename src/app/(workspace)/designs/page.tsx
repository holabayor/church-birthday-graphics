"use client";

import { useState } from "react";
import { designs, defaultMessages } from "@/lib/designs";
import { RefreshCw, LayoutTemplate, Download, ImageIcon, CheckCircle2, Loader2 } from "lucide-react";
import { BirthdayMessageManager } from "@/components/birthdays/birthday-message-manager";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DesignsPage() {
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<number | null>(null);

  const previewDesign = (index: number) => {
    setLoadingIdx(index);
    setSelectedDesign(index);
    const message = defaultMessages[0];
    const params = new URLSearchParams({
      design: index.toString(),
      first_name: "John",
      middle_name: "David",
      last_name: "Okonkwo",
      photo_url: "https://res.cloudinary.com/dev-storage/image/upload/v1770827775/teen_khqk4d.png",
      position: "Choir Director",
      date_of_birth: "1991-02-11",
      message,
    });
    setPreviewUrl(`/api/generate?${params.toString()}`);
  };

  return (
    <div className="flex-1 w-full">
      <PageHeader
        eyebrow="Celebration workflow"
        title="Birthday Management"
        description="Manage birthday templates, greeting messages, and celebration assets."
        meta={
          <div className="flex items-center gap-2 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-3 py-1.5">
            <LayoutTemplate className="h-4 w-4 text-[var(--secondary)]" />
            <span className="text-sm font-medium text-foreground">{designs.length} Templates Active</span>
          </div>
        }
      />

      <div className="space-y-6 p-4 md:space-y-8 md:p-8">
        <Tabs defaultValue="templates" className="w-full gap-6">
          <div className="overflow-x-auto rounded-xl border border-[var(--outline-variant)] bg-white p-2 shadow-sm">
            <TabsList className="grid h-auto w-max min-w-full grid-cols-[repeat(2,minmax(160px,1fr))] gap-1 bg-transparent p-0">
              <TabsTrigger
                value="templates"
                className="h-11 justify-start rounded-md border border-transparent px-3 text-sm font-medium text-[var(--on-surface-variant)] data-[state=active]:border-[var(--outline-variant)] data-[state=active]:bg-[var(--surface-container)] data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <LayoutTemplate className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="h-11 justify-start rounded-md border border-transparent px-3 text-sm font-medium text-[var(--on-surface-variant)] data-[state=active]:border-[var(--outline-variant)] data-[state=active]:bg-[var(--surface-container)] data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <ImageIcon className="h-4 w-4" />
                Messages
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="templates" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-7 xl:col-span-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {designs.map((design, i) => {
                    const isSelected = selectedDesign === i;
                    const isLoading = loadingIdx === i;

                    return (
                      <div
                        key={i}
                        onClick={() => !isLoading && previewDesign(i)}
                        className={`group relative cursor-pointer overflow-hidden rounded-xl border p-5 transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                            : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                        }`}
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            }`}
                          >
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          {isSelected && <CheckCircle2 className="h-5 w-5 animate-in zoom-in text-primary" />}
                        </div>

                        <div>
                          <h3 className={`mb-1 text-lg font-semibold transition-colors ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                            {design.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">Template Variant #{i + 1}</p>
                        </div>

                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 xl:col-span-4">
                <div className="sticky top-6">
                  <Card className="flex flex-col overflow-hidden border-[var(--outline-variant)] shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[var(--outline-variant)] bg-white pb-4">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <LayoutTemplate className="h-5 w-5 text-primary" />
                          Live Preview
                        </CardTitle>
                        <CardDescription className="mt-1">
                          See how this template looks with sample data.
                        </CardDescription>
                      </div>
                      {selectedDesign !== null && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => previewDesign(selectedDesign)}
                          disabled={loadingIdx !== null}
                          title="Regenerate Preview"
                        >
                          <RefreshCw className={`h-4 w-4 ${loadingIdx !== null ? "animate-spin" : ""}`} />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      {previewUrl ? (
                        <div className="group relative bg-muted/10 p-4">
                          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border shadow-sm md:aspect-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt="Design preview"
                              className="h-auto max-h-[500px] w-full rounded-lg object-contain"
                              onLoad={() => setLoadingIdx(null)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                              <Button asChild variant="secondary" className="shadow-lg">
                                <a href={previewUrl} download={`design-${selectedDesign}.png`}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download High-Res
                                </a>
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 text-center">
                            <p className="text-xs text-muted-foreground">Preview generated with sample member data</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex aspect-square flex-col items-center justify-center bg-muted/10 p-8 text-center md:aspect-[4/3]">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-background">
                            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                          <h3 className="font-medium text-foreground">No Template Selected</h3>
                          <p className="mt-1 max-w-[200px] text-sm text-muted-foreground">
                            Choose a design from the gallery to preview how it looks.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <BirthdayMessageManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
