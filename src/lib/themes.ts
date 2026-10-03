import { CANVAS_H, CANVAS_W } from "./config";
import type { Brand, DeckType, SlideElement, ThemeId } from "./types";

const uid = () => crypto.randomUUID();

const rect = (x: number, y: number, w: number, h: number, fill: string, opacity?: number): SlideElement => ({
  id: uid(), type: "shape", shape: "rect", role: "decor", locked: true, x, y, w, h, fill, opacity,
});
const circle = (x: number, y: number, d: number, fill: string, opacity?: number): SlideElement => ({
  id: uid(), type: "shape", shape: "ellipse", role: "decor", locked: true, x, y, w: d, h: d, fill, opacity,
});

/** İki hex rengi karıştırır (t=0 → a, t=1 → b). */
export function mix(a: string, b: string, t: number): string {
  const p = (h: string) => {
    const x = h.replace("#", "");
    const f = x.length === 3 ? x.split("").map((c) => c + c).join("") : x;
    const n = parseInt(f, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  const h = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${h(r1 + (r2 - r1) * t)}${h(g1 + (g2 - g1) * t)}${h(b1 + (b2 - b1) * t)}`;
}

export type Palette = {
  titleGradient?: [string, string]; // başlık/kapanış slaytı gradyanı
  bgTitle: string;
  bgContent: string;
  titleText: string; // başlık/kapanış slaytındaki metin
  heading: string; // içerik slaytı başlıkları
  body: string;
  muted: string;
};

export type Theme = {
  id: ThemeId;
  name: string;
  desc: string;
  defaults: { primary: string; accent: string; font: string };
  headingFont?: string; // serif + sans eşleştirmesi: farklı aileden başlık fontu
  palette: (b: Brand) => Palette;
  decor: (kind: "title" | "content", b: Brand) => SlideElement[];
};

/** Kilim benzeri tekrar eden şerit: alternatif renkli bloklar. */
function kilim(y: number, h: number, a: string, b: string): SlideElement[] {
  const n = 16;
  const w = CANVAS_W / n;
  return Array.from({ length: n }, (_, i) => rect(i * w, y, w, h, i % 2 ? a : b));
}

export const THEMES: Theme[] = [
  {
    id: "klasik",
    name: "Klasik",
    desc: "Sade ve kurumsal",
    defaults: { primary: "#1e3a8a", accent: "#f59e0b", font: "Inter" },
    palette: (b) => ({
      titleGradient: [b.primary, mix(b.primary, "#000000", 0.45)],
      bgTitle: b.primary, bgContent: "#FFFFFF", titleText: "#FFFFFF",
      heading: b.primary, body: "#111827", muted: "#4B5563",
    }),
    decor: () => [],
  },
  {
    id: "gece",
    name: "Gece",
    desc: "Koyu, modern, neon vurgulu",
    defaults: { primary: "#0f172a", accent: "#22d3ee", font: "Montserrat" },
    palette: (b) => ({
      titleGradient: [b.primary, mix(b.primary, b.accent, 0.35)],
      bgTitle: b.primary, bgContent: b.primary, titleText: "#FFFFFF",
      heading: "#FFFFFF", body: "#E2E8F0", muted: "#94A3B8",
    }),
    decor: (kind, b) =>
      kind === "title"
        ? [circle(820, -140, 600, b.accent, 0.14), circle(1000, 420, 360, b.accent, 0.1), circle(-120, 560, 260, "#FFFFFF", 0.05)]
        : [rect(0, 0, CANVAS_W, 8, b.accent), circle(1100, -100, 300, b.accent, 0.08)],
  },
  {
    id: "pastel",
    name: "Pastel",
    desc: "Yumuşak, öğrenci dostu",
    defaults: { primary: "#6d28d9", accent: "#fb7185", font: "Poppins" },
    palette: (b) => ({
      titleGradient: ["#FFF1E6", mix("#FFF1E6", b.accent, 0.35)],
      bgTitle: "#FFF1E6", bgContent: "#FFF8F0", titleText: b.primary,
      heading: b.primary, body: "#3f3f46", muted: "#71717a",
    }),
    decor: (kind, b) =>
      kind === "title"
        ? [circle(880, -120, 520, b.accent, 0.35), circle(1020, 380, 380, b.primary, 0.16), circle(-100, 540, 300, b.accent, 0.22)]
        : [circle(1120, -80, 240, b.accent, 0.3), circle(-70, 620, 200, b.primary, 0.12)],
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Bol boşluk, ince çizgiler",
    defaults: { primary: "#111827", accent: "#ef4444", font: "Inter" },
    palette: (b) => ({
      bgTitle: "#FFFFFF", bgContent: "#FFFFFF", titleText: b.primary,
      heading: b.primary, body: "#1f2937", muted: "#6b7280",
    }),
    decor: (kind, b) =>
      kind === "title"
        ? [rect(80, 80, 28, 28, b.accent), rect(80, 664, 1120, 2, b.primary)]
        : [rect(80, 672, 1120, 2, "#E5E7EB"), rect(80, 40, 28, 6, b.accent)],
  },
  {
    id: "cesur",
    name: "Cesur",
    desc: "Büyük renk blokları",
    defaults: { primary: "#0f766e", accent: "#fde047", font: "Montserrat" },
    palette: (b) => ({
      bgTitle: b.accent, bgContent: "#FFFFFF", titleText: "#111827",
      heading: b.primary, body: "#111827", muted: "#4B5563",
    }),
    decor: (kind, b) =>
      kind === "title"
        ? [rect(0, 600, CANVAS_W, 120, b.primary), circle(1040, 440, 300, b.primary, 0.9)]
        : [rect(0, 0, 16, CANVAS_H, b.primary), rect(1160, 0, 120, 24, b.accent)],
  },
  {
    id: "anadolu",
    name: "Anadolu",
    desc: "Kilim şeritli, sıcak tonlar",
    defaults: { primary: "#7c2d12", accent: "#d97706", font: "Noto Sans" },
    headingFont: "Playfair Display",
    palette: (b) => ({
      bgTitle: "#FBF3E4", bgContent: "#FBF3E4", titleText: b.primary,
      heading: b.primary, body: "#3b2a20", muted: "#78560f",
    }),
    decor: (kind, b) =>
      kind === "title"
        ? [...kilim(0, 28, b.primary, b.accent), ...kilim(692, 28, b.accent, b.primary)]
        : [...kilim(0, 14, b.primary, b.accent), ...kilim(706, 14, b.accent, b.primary)],
  },
  {
    id: "kurumsal",
    name: "Kurumsal",
    desc: "Mavi tonlu, resmi sunumlar",
    defaults: { primary: "#0c4a6e", accent: "#0ea5e9", font: "Noto Sans" },
    palette: (b) => ({
      titleGradient: [b.primary, mix(b.primary, b.accent, 0.5)],
      bgTitle: b.primary, bgContent: "#F1F5F9", titleText: "#FFFFFF",
      heading: b.primary, body: "#0f172a", muted: "#475569",
    }),
    decor: (kind, b) =>
      kind === "title"
        ? [rect(880, 0, 400, CANVAS_H, "#FFFFFF", 0.07), rect(0, 0, CANVAS_W, 10, b.accent)]
        : [rect(0, 0, CANVAS_W, 8, b.primary), rect(0, 700, CANVAS_W, 20, b.primary)],
  },
];

export const getTheme = (id?: ThemeId): Theme => THEMES.find((t) => t.id === id) ?? THEMES[0];

/** Sunum tipine göre önerilen tema. */
export const DEFAULT_THEME_FOR: Record<DeckType, ThemeId> = {
  odev: "pastel",
  proje: "kurumsal",
  kobi: "anadolu",
  yatirimci: "cesur",
};

// ---- Erişilebilir kontrast (WCAG) ----
const rgb = (h: string): [number, number, number] => {
  const x = h.replace("#", "");
  const f = x.length === 3 ? x.split("").map((c) => c + c).join("") : x;
  const n = parseInt(f, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lum = (h: string) => {
  const [r, g, b] = rgb(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrastRatio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** fg rengini, tüm arka planlarda en az `min` kontrast sağlayana dek siyaha/beyaza yaklaştırır. */
export function ensureContrast(fg: string, bgs: string[], min = 4.5): string {
  const ok = (c: string) => bgs.every((bg) => contrastRatio(c, bg) >= min);
  if (ok(fg)) return fg;
  const avgLum = bgs.reduce((a, b) => a + lum(b), 0) / bgs.length;
  const target = avgLum > 0.4 ? "#000000" : "#FFFFFF"; // açık zeminde koyulaştır, koyu zeminde açıklaştır
  for (let t = 0.1; t <= 1; t += 0.1) {
    const c = mix(fg, target, t);
    if (ok(c)) return c;
  }
  return target;
}
