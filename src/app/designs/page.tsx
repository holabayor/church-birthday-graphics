"use client";

import { useState } from "react";
import { designs, defaultMessages } from "@/lib/designs";
import { RefreshCw } from "lucide-react";

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
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Design Templates</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {designs.length} designs available - one is randomly chosen for each birthday
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="grid grid-cols-2 gap-3">
            {designs.map((design, i) => (
              <button
                key={i}
                onClick={() => previewDesign(i)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedDesign === i
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-lg"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:shadow-sm"
                }`}
              >
                <div className="text-sm font-medium">{design.name}</div>
                <div className={`text-xs mt-1 ${selectedDesign === i ? "text-zinc-300" : "text-zinc-400"}`}>
                  Design #{i + 1}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Preview</h2>
            {selectedDesign !== null && (
              <button
                onClick={() => previewDesign(selectedDesign)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
            )}
          </div>
          {previewUrl ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Design preview"
                className="w-full rounded-lg"
                onLoad={() => setLoadingIdx(null)}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Sample with: John David Okonkwo</span>
                <a
                  href={previewUrl}
                  download={`design-${selectedDesign}.png`}
                  className="text-xs text-zinc-600 hover:text-zinc-900 underline"
                >
                  Download
                </a>
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-zinc-50 rounded-lg">
              <p className="text-zinc-400 text-sm">
                {loadingIdx !== null ? "Generating..." : "Select a design to preview"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
