import { renderToStaticMarkup } from "react-dom/server";
import { designs } from "@/lib/designs";
import { Member } from "@/lib/types";

export function renderDesignToHtml({
  designIndex,
  member,
  message,
  churchLogoUrl,
}: {
  designIndex: number;
  member: Member;
  message: string;
  churchLogoUrl?: string;
}): string {
  const design = designs[designIndex % designs.length];
  const element = design.render({ member, message, churchLogoUrl });
  const componentHtml = renderToStaticMarkup(element);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 1080px;
            height: 1080px;
            font-family: 'Inter', sans-serif;
            -webkit-font-smoothing: antialiased;
            box-sizing: border-box;
          }
          * { box-sizing: inherit; }
        </style>
      </head>
      <body>
        ${componentHtml}
      </body>
    </html>
  `;
}
