import { LAYOUT_NAMES, type SlideContent } from "./types";

const strs = (a: unknown): string[] =>
  Array.isArray(a) ? a.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];

/** Uzun maddeyi ~14 kelimede keser (okunabilirlik). */
const clip = (s: string) => {
  const w = s.trim().split(/\s+/);
  return w.length > 14 ? w.slice(0, 14).join(" ") + "…" : s.trim();
};

/** Model tek uzun paragraf verdiyse cümlelere bölerek madde listesi yapar. */
const explode = (b: string[]): string[] => {
  if (b.length !== 1 || b[0].length < 90) return b;
  const parts = b[0].split(/(?<=[.!?])\s+/).map((x) => x.replace(/[.]$/, "").trim()).filter(Boolean);
  return parts.length >= 2 ? parts : b;
};

const col = (c: unknown) => {
  const o = (c ?? {}) as { heading?: unknown; bullets?: unknown };
  return { heading: typeof o.heading === "string" ? o.heading : "", bullets: explode(strs(o.bullets)).slice(0, 4).map(clip) };
};

/** Model çıktısını doğrular: bilinmeyen layout → title-bullets, eksik alanlar doldurulur. */
export function sanitizeSlide(s: Partial<SlideContent> | undefined): SlideContent {
  const raw = s ?? {};
  const layout = LAYOUT_NAMES.includes(raw.layout as never) ? raw.layout! : "title-bullets";
  const out: SlideContent = {
    layout,
    title: typeof raw.title === "string" ? raw.title : "",
    subtitle: raw.subtitle || undefined,
    bullets: explode(strs(raw.bullets)).slice(0, 5).map(clip), // tasarım ilkesi: en fazla 5 satır, kısa
    icon: typeof raw.icon === "string" && raw.icon.trim() ? [...raw.icon.trim()].slice(0, 2).join("") : undefined,
    number: raw.number || undefined,
    caption: raw.caption || undefined,
    quote: raw.quote || undefined,
    author: raw.author || undefined,
    notes: raw.notes || undefined,
  };
  // Model maddeleri alt başlığa yazdıysa ondan madde yap (boş slayt kalmasın)
  if ((layout === "split" || layout === "title-bullets") && !out.bullets!.length && out.subtitle) {
    out.bullets = explode([out.subtitle]).slice(0, 5).map(clip);
    out.subtitle = undefined;
  }
  if (layout === "cards" || layout === "steps") {
    const max = layout === "cards" ? 4 : 5;
    const items = (Array.isArray(raw.items) ? raw.items : [])
      .filter((i) => i && typeof i.heading === "string" && i.heading.trim())
      .slice(0, max)
      .map((i) => ({ heading: i.heading.trim(), text: typeof i.text === "string" ? clip(i.text) : "" }));
    // en az 2 öğe yoksa maddelerden türet, o da yoksa güvenli kalıba düş
    if (items.length >= 2) out.items = items;
    else if (out.bullets!.length >= 2) out.items = out.bullets!.slice(0, max).map((b) => ({ heading: b, text: "" }));
    else out.layout = "title-bullets";
  }
  if (layout === "two-column") {
    out.left = col(raw.left);
    out.right = col(raw.right);
  }
  // İçeriği boş kalan kalıbı güvenli kalıba düşür
  if (layout === "two-column" && !out.left!.bullets.length && !out.right!.bullets.length) {
    out.layout = "title-bullets";
  }
  if (layout === "split" && !out.bullets!.length) out.layout = "title-bullets";
  if (layout === "quote" && !out.quote) out.layout = "title-bullets";
  if (layout === "big-number" && !out.number) out.layout = "title-bullets";
  return out;
}
