import { CANVAS_H, CANVAS_W } from "./config";
import type { Brand, LayoutName, Slide, SlideContent, SlideElement, TextStyle } from "./types";
import { LAYOUT_NAMES } from "./types";
import { ensureContrast, getTheme, mix, type Palette } from "./themes";

const M = 80; // kenar boşluğu
const uid = () => crypto.randomUUID();

/** Hex rengin algısal parlaklığına göre okunaklı metin rengi. */
export function contrastColor(bg: string): string {
  const hex = bg.replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "#111827";
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.6 ? "#FFFFFF" : "#111827";
}

const text = (
  role: SlideElement["role"],
  t: string,
  x: number,
  y: number,
  w: number,
  h: number,
  style: TextStyle
): SlideElement => ({
  id: uid(),
  type: "text",
  role,
  text: t,
  x,
  y,
  w,
  h,
  // Tipografi kuralı: büyük metin = sıkı satır aralığı, gövde metni = geniş
  style: {
    ...style,
    lineHeight:
      style.fontSize >= 48 ? 1.05 : style.fontSize >= 36 ? Math.min(style.lineHeight ?? 1.2, 1.2) : style.lineHeight ?? 1.4,
  },
});

const shape = (x: number, y: number, w: number, h: number, fill: string): SlideElement => ({
  id: uid(),
  type: "shape",
  role: "decor",
  x,
  y,
  w,
  h,
  fill,
});

const logoEl = (brand: Brand, x: number, y: number): SlideElement[] =>
  brand.logo
    ? [{ id: uid(), type: "image", role: "logo", x, y, w: 140, h: 70, src: brand.logo }]
    : [];

/** Madde sayısı ve uzunluğuna göre font boyutu. */
function bulletSize(bullets: string[], base = 26): number {
  const chars = bullets.reduce((a, b) => a + b.length, 0);
  if (bullets.length >= 5 || chars > 330) return Math.min(base, 22);
  if (bullets.length === 4 && chars > 240) return Math.min(base, 24);
  return base;
}

const bulletsText = (b: string[]) => b.join("\n");

function titleLike(c: SlideContent, brand: Brand, p: Palette): SlideElement[] {
  const fg = p.titleText;
  const els: SlideElement[] = [
    shape(M, 232, 120, 8, brand.accent),
    text("title", c.title, M, 262, 1120, 150, {
      fontSize: c.title.length > 48 ? 52 : 64,
      color: fg,
      bold: true,
      align: "left",
      lineHeight: 1.15,
    }),
  ];
  if (c.subtitle) {
    els.push(
      text("subtitle", c.subtitle, M, 430, 1120, 90, {
        fontSize: 28,
        color: fg,
        align: "left",
        lineHeight: 1.3,
      })
    );
  }
  els.push(...logoEl(brand, CANVAS_W - M - 140, CANVAS_H - 70 - 40));
  return els;
}

export function buildSlide(content: SlideContent, brand: Brand): Slide {
  const layout: LayoutName = LAYOUT_NAMES.includes(content.layout) ? content.layout : "title-bullets";
  const c = { ...content, layout };
  const theme = getTheme(brand.theme);
  const raw = theme.palette(brand);
  // Erişilebilirlik: kullanıcı hangi rengi seçerse seçsin metin ≥ 4,5:1 kontrast sağlar
  const titleBgs = raw.titleGradient ?? [raw.bgTitle];
  const p: Palette = {
    ...raw,
    heading: ensureContrast(raw.heading, [raw.bgContent]),
    body: ensureContrast(raw.body, [raw.bgContent]),
    muted: ensureContrast(raw.muted, [raw.bgContent]),
    titleText: ensureContrast(raw.titleText, titleBgs),
  };
  const accentText = ensureContrast(brand.accent, [raw.bgContent], 3); // büyük metin eşiği
  const isTitle = layout === "title" || layout === "closing";
  const hero = isTitle || layout === "statement";
  const background = hero ? p.bgTitle : p.bgContent;
  let elements: SlideElement[] = [];
  const dark = p.body;

  switch (layout) {
    case "title":
    case "closing": {
      elements = titleLike(c, brand, p);
      break;
    }
    case "section": {
      elements = [
        shape(0, 0, 24, CANVAS_H, brand.accent),
        text("title", c.title, 120, 250, 1040, 140, {
          fontSize: 56,
          color: p.heading,
          bold: true,
          lineHeight: 1.15,
        }),
      ];
      if (c.subtitle)
        elements.push(
          text("subtitle", c.subtitle, 120, 410, 1040, 90, {
            fontSize: 26,
            color: p.muted,
            lineHeight: 1.3,
          })
        );
      elements.push(...logoEl(brand, CANVAS_W - M - 140, CANVAS_H - 110));
      break;
    }
    case "title-bullets": {
      const b = c.bullets ?? [];
      elements = [
        text("title", c.title, M, 60, 1120, 90, {
          fontSize: c.title.length > 50 ? 36 : 44,
          color: p.heading,
          bold: true,
          lineHeight: 1.15,
        }),
        shape(M, 160, 160, 6, brand.accent),
        text("bullets", bulletsText(b), M, 190, 1120, 450, {
          fontSize: bulletSize(b),
          color: dark,
          lineHeight: 1.5,
        }),
        ...logoEl(brand, CANVAS_W - M - 140, CANVAS_H - 90),
      ];
      break;
    }
    case "two-column": {
      const l = c.left ?? { heading: "", bullets: [] };
      const r = c.right ?? { heading: "", bullets: [] };
      const size = bulletSize([...l.bullets, ...r.bullets], 24);
      elements = [
        text("title", c.title, M, 60, 1120, 90, {
          fontSize: c.title.length > 50 ? 36 : 44,
          color: p.heading,
          bold: true,
          lineHeight: 1.15,
        }),
        shape(M, 160, 160, 6, brand.accent),
        text("subtitle", l.heading, M, 190, 540, 56, { fontSize: 28, color: accentText, bold: true }),
        text("bullets", bulletsText(l.bullets), M, 255, 540, 385, {
          fontSize: Math.min(size, 24),
          color: dark,
          lineHeight: 1.5,
        }),
        text("subtitle", r.heading, 660, 190, 540, 56, { fontSize: 28, color: accentText, bold: true }),
        text("bullets", bulletsText(r.bullets), 660, 255, 540, 385, {
          fontSize: Math.min(size, 24),
          color: dark,
          lineHeight: 1.5,
        }),
        ...logoEl(brand, CANVAS_W - M - 140, CANVAS_H - 90),
      ];
      break;
    }
    case "big-number": {
      elements = [
        text("title", c.title, M, 60, 1120, 90, {
          fontSize: 40,
          color: p.heading,
          bold: true,
          align: "center",
        }),
        text("number", c.number ?? "", M, 190, 1120, 240, {
          fontSize: (c.number ?? "").length > 9 ? 120 : 160,
          color: accentText,
          bold: true,
          align: "center",
          lineHeight: 1.1,
        }),
        text("caption", c.caption ?? "", 160, 460, 960, 120, {
          fontSize: 28,
          color: dark,
          align: "center",
          lineHeight: 1.4,
        }),
        ...logoEl(brand, CANVAS_W - M - 140, CANVAS_H - 90),
      ];
      break;
    }
    case "split": {
      // Tasarım ilkesi: görsel bir yanda, metin karşı yanda. Görsel yerine ikonlu panel;
      // kullanıcı panele kendi görselini ekleyebilir.
      const b = c.bullets ?? [];
      elements = [
        text("title", c.title, M, 60, 1120, 90, {
          fontSize: c.title.length > 50 ? 36 : 44,
          color: p.heading,
          bold: true,
          lineHeight: 1.15,
        }),
        shape(M, 160, 160, 6, brand.accent),
        text("bullets", bulletsText(b), M, 190, 540, 450, {
          fontSize: Math.min(bulletSize(b), 24),
          color: dark,
          lineHeight: 1.5,
        }),
        { ...shape(700, 180, 500, 450, brand.accent), opacity: 0.16, locked: true },
        { ...shape(790, 240, 320, 320, brand.accent), shape: "ellipse", opacity: 0.22, locked: true },
        text("decor", c.icon || "💡", 700, 250, 500, 320, {
          fontSize: 190,
          color: p.heading,
          align: "center",
          lineHeight: 1.2,
        }),
        ...logoEl(brand, CANVAS_W - M - 140, CANVAS_H - 90),
      ];
      break;
    }
    case "statement": {
      // Tek vurucu cümle: güçlü renk, görsel dikkat dağıtıcı yok
      elements = [
        text("title", c.title, 120, 190, 1040, 330, {
          fontSize: c.title.length > 70 ? 48 : 60,
          color: p.titleText,
          bold: true,
          lineHeight: 1.05,
        }),
      ];
      if (c.subtitle)
        elements.push(
          text("subtitle", c.subtitle, 120, 540, 1040, 80, { fontSize: 26, color: p.titleText, lineHeight: 1.3 })
        );
      elements.push(...logoEl(brand, CANVAS_W - M - 140, CANVAS_H - 110));
      break;
    }
    case "cards": {
      // Gruplama (chunking): 2-4 kart, numara rozeti, tutarlı yumuşak gölge
      const items = c.items ?? [];
      const n = Math.max(1, items.length);
      const gap = 32;
      const cw = (1120 - gap * (n - 1)) / n;
      const cardFill = mix(p.bgContent, p.heading, 0.07);
      elements = [
        text("title", c.title, M, 60, 1120, 90, {
          fontSize: c.title.length > 50 ? 36 : 44,
          color: p.heading,
          bold: true,
        }),
        shape(M, 160, 160, 6, brand.accent),
      ];
      items.forEach((it, i) => {
        const x = Math.round(M + i * (cw + gap));
        const pad = 28;
        elements.push(
          { ...shape(x, 200, Math.round(cw), 410, cardFill), shape: "round", shadow: true, locked: true },
          { ...shape(x + pad, 228, 56, 56, brand.accent), shape: "ellipse", locked: true },
          text("decor", String(i + 1), x + pad, 228, 56, 56, {
            fontSize: 26,
            color: contrastColor(brand.accent),
            bold: true,
            align: "center",
            lineHeight: 2.1,
          }),
          text("subtitle", it.heading, x + pad, 310, Math.round(cw) - pad * 2, 90, {
            fontSize: n >= 4 ? 22 : 26,
            color: p.heading,
            bold: true,
            lineHeight: 1.2,
          }),
          text("body", it.text, x + pad, 410, Math.round(cw) - pad * 2, 180, {
            fontSize: n >= 4 ? 18 : 20,
            color: p.body,
            lineHeight: 1.45,
          })
        );
      });
      elements.push(...logoEl(brand, CANVAS_W - M - 140, CANVAS_H - 90));
      break;
    }
    case "steps": {
      // Yol haritası / zaman çizelgesi: soldan sağa, numaralı duraklar
      const items = c.items ?? [];
      const n = Math.max(1, items.length);
      const colW = 1120 / n;
      elements = [
        text("title", c.title, M, 60, 1120, 90, {
          fontSize: c.title.length > 50 ? 36 : 44,
          color: p.heading,
          bold: true,
        }),
        shape(M, 160, 160, 6, brand.accent),
        { ...shape(M + colW / 2, 297, 1120 - colW, 4, mix(p.bgContent, p.heading, 0.25)), locked: true },
      ];
      items.forEach((it, i) => {
        const x = Math.round(M + i * colW);
        elements.push(
          { ...shape(Math.round(x + colW / 2 - 32), 270, 64, 64, brand.accent), shape: "ellipse", shadow: true, locked: true },
          text("decor", String(i + 1), Math.round(x + colW / 2 - 32), 270, 64, 64, {
            fontSize: 28,
            color: contrastColor(brand.accent),
            bold: true,
            align: "center",
            lineHeight: 2.0,
          }),
          text("subtitle", it.heading, x + 12, 365, Math.round(colW) - 24, 80, {
            fontSize: n >= 5 ? 20 : 24,
            color: p.heading,
            bold: true,
            align: "center",
            lineHeight: 1.2,
          }),
          text("body", it.text, x + 12, 450, Math.round(colW) - 24, 170, {
            fontSize: n >= 5 ? 17 : 19,
            color: p.body,
            align: "center",
            lineHeight: 1.45,
          })
        );
      });
      elements.push(...logoEl(brand, CANVAS_W - M - 140, CANVAS_H - 90));
      break;
    }
    case "quote": {
      elements = [
        text("decor", "“", 100, 60, 200, 200, {
          fontSize: 200,
          color: accentText,
          bold: true,
        }),
        text("quote", c.quote ?? c.title, 160, 200, 960, 280, {
          fontSize: (c.quote ?? c.title).length > 140 ? 30 : 36,
          color: p.heading,
          italic: true,
          lineHeight: 1.4,
        }),
        text("caption", c.author ? `— ${c.author}` : "", 160, 500, 960, 50, {
          fontSize: 24,
          color: p.muted,
        }),
        ...logoEl(brand, CANVAS_W - M - 140, CANVAS_H - 90),
      ];
      break;
    }
  }

  return {
    id: uid(),
    layout,
    background,
    gradient: hero && p.titleGradient ? { from: p.titleGradient[0], to: p.titleGradient[1], angle: 135 } : undefined,
    elements: [
      ...theme.decor(hero ? "title" : "content", brand),
      ...elements.map((e) =>
        theme.headingFont && e.type === "text" && (e.role === "title" || e.role === "number" || e.role === "quote")
          ? { ...e, font: theme.headingFont }
          : e
      ),
    ],
    notes: c.notes,
    content: c,
  };
}

/** Tuvaldaki (elle düzenlenmiş olabilecek) metinlerden SlideContent'i geri toplar. */
export function recoverContent(slide: Slide): SlideContent {
  const base: SlideContent = { ...(slide.content ?? { layout: slide.layout, title: "" }), layout: slide.layout };
  const texts = slide.elements.filter((e) => e.type === "text");
  const lines = (s?: string) => (s ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
  const byRole = (r: string) => texts.filter((e) => e.role === r);
  const title = byRole("title")[0]?.text;
  if (title !== undefined) base.title = title;
  const sub = byRole("subtitle");
  const bul = byRole("bullets");

  switch (slide.layout) {
    case "title":
    case "closing":
    case "section":
      if (sub[0]) base.subtitle = sub[0].text;
      break;
    case "title-bullets":
      if (bul[0]) base.bullets = lines(bul[0].text);
      break;
    case "cards":
    case "steps": {
      const heads = byRole("subtitle");
      const bodies = byRole("body");
      base.items = heads.map((h, i) => ({ heading: h.text ?? "", text: bodies[i]?.text ?? "" }));
      break;
    }
    case "statement":
      if (sub[0]) base.subtitle = sub[0].text;
      break;
    case "split":
      if (bul[0]) base.bullets = lines(bul[0].text);
      base.icon = byRole("decor")[0]?.text ?? base.icon;
      break;
    case "two-column":
      base.left = { heading: sub[0]?.text ?? "", bullets: lines(bul[0]?.text) };
      base.right = { heading: sub[1]?.text ?? "", bullets: lines(bul[1]?.text) };
      break;
    case "big-number":
      base.number = byRole("number")[0]?.text ?? base.number;
      base.caption = byRole("caption")[0]?.text ?? base.caption;
      break;
    case "quote":
      base.quote = byRole("quote")[0]?.text ?? base.quote;
      base.author = byRole("caption")[0]?.text?.replace(/^—\s*/, "") ?? base.author;
      break;
  }
  base.notes = slide.notes;
  return base;
}

export function buildDeckSlides(contents: SlideContent[], brand: Brand): Slide[] {
  return contents.map((c) => buildSlide(c, brand));
}
