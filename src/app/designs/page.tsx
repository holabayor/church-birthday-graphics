"use client";

import { useState } from "react";
import { designs, defaultMessages } from "@/lib/designs";
import { RefreshCw, LayoutTemplate, Palette, Download, ImageIcon, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Palette className="h-8 w-8 text-primary" />
            Design Center
          </h1>
          <p className="text-muted-foreground font-medium">
            Explore and preview the available graphic templates used for celebrations.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg border">
          <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{designs.length} Templates Active</span>
        </div>
      </div>

      <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-12">
        {/* Templates Grid */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {designs.map((design, i) => {
              const isSelected = selectedDesign === i;
              const isLoading = loadingIdx === i;

              return (
                <div
                  key={i}
                  onClick={() => !isLoading && previewDesign(i)}
                  className={`relative group p-5 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden
                    ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors
                        ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}
                      `}
                    >
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary animate-in zoom-in" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className={`font-semibold text-lg mb-1 transition-colors
                      ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"}
                    `}>
                      {design.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Template Variant #{i + 1}
                    </p>
                  </div>

                  {isLoading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-6">
            <Card className="shadow-sm border-muted overflow-hidden flex flex-col">
              <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
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
                  <div className="relative group bg-muted/10 p-4">
                    <div className="relative rounded-lg overflow-hidden border shadow-sm aspect-square md:aspect-auto flex justify-center items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Design preview"
                        className="w-full h-auto max-h-[500px] object-contain rounded-lg"
                        onLoad={() => setLoadingIdx(null)}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-lg">
                        <Button asChild variant="secondary" className="shadow-lg">
                          <a href={previewUrl} download={`design-${selectedDesign}.png`}>
                            <Download className="mr-2 h-4 w-4" />
                            Download High-Res
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Preview generated with sample member data
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center aspect-square md:aspect-[4/3] bg-muted/10">
                    <div className="h-16 w-16 rounded-full bg-background border border-dashed border-muted-foreground/30 flex items-center justify-center mb-4">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-medium text-foreground">No Template Selected</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] mt-1">
                      Choose a design from the gallery to preview how it looks.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
