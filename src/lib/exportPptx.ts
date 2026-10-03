import type { Deck, SlideElement } from "./types";

const inch = (px: number) => px / 96;
const pt = (px: number) => px * 0.75;
const hex = (c: string) => c.replace("#", "").toUpperCase();

export async function exportPptx(deck: Deck) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 inç
  pptx.title = deck.title;

  for (const s of deck.slides) {
    const slide = pptx.addSlide();
    // Gradyan: PPTX arka planı tek renk olduğundan arka plan görseli olarak gömülür (metinler yine düzenlenebilir)
    const grad = s.gradient ? gradientPng(s.gradient) : null;
    slide.background = grad ? { data: grad } : { color: hex(s.background) };

    for (const el of s.elements) {
      const pos = { x: inch(el.x), y: inch(el.y), w: inch(el.w), h: inch(el.h) };
      if (el.type === "shape") {
        const kind =
          el.shape === "ellipse" ? pptx.ShapeType.ellipse : el.shape === "round" ? pptx.ShapeType.roundRect : pptx.ShapeType.rect;
        slide.addShape(kind, {
          ...pos,
          ...(el.shape === "round" ? { rectRadius: 0.2 } : {}),
          ...(el.shadow ? { shadow: { type: "outer" as const, color: "000000", opacity: 0.14, blur: 14, offset: 4, angle: 90 } } : {}),
          fill: { color: hex(el.fill ?? "#000000"), transparency: Math.round((1 - (el.opacity ?? 1)) * 100) },
          line: { type: "none" },
        });
      } else if (el.type === "image" && el.src) {
        slide.addImage({ data: el.src, ...pos, sizing: { type: "contain", w: pos.w, h: pos.h } });
      } else if (el.type === "text") {
        addText(slide, el, pos, deck.brand.font);
      }
    }
    if (s.notes) slide.addNotes(s.notes);
  }

  await pptx.writeFile({ fileName: `${safeName(deck.title)}.pptx` });
}

/** Gradyanı 1280×720 PNG data URL'ine çizer (yalnızca tarayıcıda; aksi halde düz renge düşer). */
function gradientPng(g: { from: string; to: string; angle: number }): string | null {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = 1280;
  cv.height = 720;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  // CSS açısı: 0deg = aşağıdan yukarı, saat yönünde artar
  const a = ((g.angle - 90) * Math.PI) / 180;
  const cx = 640, cy = 360;
  const len = Math.abs(1280 * Math.cos(a)) / 2 + Math.abs(720 * Math.sin(a)) / 2;
  const grd = ctx.createLinearGradient(cx - Math.cos(a) * len, cy - Math.sin(a) * len, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
  grd.addColorStop(0, g.from);
  grd.addColorStop(1, g.to);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 1280, 720);
  return cv.toDataURL("image/png");
}

function addText(
  slide: ReturnType<InstanceType<typeof import("pptxgenjs").default>["addSlide"]>,
  el: SlideElement,
  pos: { x: number; y: number; w: number; h: number },
  fontFace: string
) {
  const st = el.style!;
  const opts = {
    ...pos,
    fontFace: el.font ?? fontFace,
    fontSize: pt(st.fontSize),
    color: hex(st.color),
    bold: !!st.bold,
    italic: !!st.italic,
    align: st.align ?? "left",
    valign: "top" as const,
    margin: 0,
    fit: "shrink" as const,
    lineSpacingMultiple: st.lineHeight ?? 1.2,
  };
  if (el.role === "bullets") {
    const lines = (el.text ?? "").split("\n").filter((l) => l.trim() !== "");
    slide.addText(
      lines.map((l) => ({
        text: l,
        options: { bullet: { indent: pt(st.fontSize) * 1.2 }, breakLine: true, paraSpaceAfter: 6 },
      })),
      opts
    );
  } else {
    slide.addText(el.text ?? "", opts);
  }
}

export const safeName = (t: string) =>
  t.replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 60) || "sunum";
