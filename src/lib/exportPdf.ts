import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { CANVAS_H, CANVAS_W } from "./config";
import type { Deck } from "./types";
import { SlideCanvas } from "@/components/SlideCanvas";
import { safeName } from "./exportPptx";

/** Her slaytı ekran dışında 1280×720 render eder, PNG'ye çevirip PDF'te birleştirir. */
export async function exportPdf(deck: Deck) {
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-99999px;top:0;width:${CANVAS_W}px;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(
    createElement(
      "div",
      null,
      deck.slides.map((s) => createElement("div", { key: s.id, "data-page": "" }, createElement(SlideCanvas, { slide: s, brand: deck.brand, scale: 1 })))
    )
  );

  try {
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 300));
    const pages = Array.from(host.querySelectorAll<HTMLElement>("[data-slide-root]"));
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [CANVAS_W, CANVAS_H], compress: true });
    for (let i = 0; i < pages.length; i++) {
      const png = await toPng(pages[i], { pixelRatio: 2, width: CANVAS_W, height: CANVAS_H });
      if (i > 0) pdf.addPage([CANVAS_W, CANVAS_H], "landscape");
      pdf.addImage(png, "PNG", 0, 0, CANVAS_W, CANVAS_H, undefined, "FAST");
    }
    pdf.save(`${safeName(deck.title)}.pdf`);
  } finally {
    root.unmount();
    host.remove();
  }
}
