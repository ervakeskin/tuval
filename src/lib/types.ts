// Tuval: 1280 x 720 px (16:9)
export type ElementType = "text" | "shape" | "image";

export type DeckType = "odev" | "proje" | "kobi" | "yatirimci";
export type LayoutName =
  | "title"
  | "section"
  | "title-bullets"
  | "two-column"
  | "big-number"
  | "quote"
  | "split"
  | "cards"
  | "steps"
  | "statement"
  | "closing";

export const LAYOUT_NAMES: LayoutName[] = [
  "title",
  "section",
  "title-bullets",
  "two-column",
  "big-number",
  "quote",
  "split",
  "cards",
  "steps",
  "statement",
  "closing",
];

export type TextStyle = {
  fontSize: number; // px
  color: string; // hex
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
  lineHeight?: number;
};

export type ThemeId = "klasik" | "gece" | "pastel" | "minimal" | "cesur" | "anadolu" | "kurumsal";

export type SlideElement = {
  id: string;
  type: ElementType;
  shape?: "rect" | "ellipse" | "round"; // type "shape" için (varsayılan rect)
  font?: string; // başlık fontu (temanın başlık/gövde eşleştirmesi); yoksa marka fontu
  shadow?: boolean; // yumuşak, tutarlı gölge (kartlar)
  opacity?: number; // 0-1, shape için
  locked?: boolean; // tema süsü: editörde seçilemez/taşınamaz
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string; // satırlar \n ile; madde listesi için role "bullets"
  role?:
    | "title"
    | "subtitle"
    | "body"
    | "bullets"
    | "number"
    | "caption"
    | "quote"
    | "logo"
    | "decor";
  style?: TextStyle;
  fill?: string; // shape rengi
  src?: string; // image data URL
};

export type SlideContent = {
  layout: LayoutName;
  title: string;
  subtitle?: string;
  bullets?: string[];
  left?: { heading: string; bullets: string[] };
  right?: { heading: string; bullets: string[] };
  number?: string;
  caption?: string;
  quote?: string;
  author?: string;
  icon?: string; // split: tek bir emoji
  items?: { heading: string; text: string }[]; // cards (3-4) / steps (3-5)
  notes?: string;
};

export type DeckContent = { title: string; slides: SlideContent[] };

export type Slide = {
  id: string;
  layout: LayoutName;
  background: string;
  gradient?: { from: string; to: string; angle: number }; // başlık/kapanış slaytları
  elements: SlideElement[];
  notes?: string; // konuşmacı notu → PPTX notes
  content?: SlideContent; // slaytın üretildiği içerik (AI düzenleme için)
};

export type Brand = {
  primary: string;
  accent: string;
  font: string;
  logo?: string;
  theme?: ThemeId;
};

export type Deck = {
  id: string;
  title: string;
  deckType: DeckType;
  brand: Brand;
  slides: Slide[];
  updatedAt: number;
};

export const DECK_TYPES: { id: DeckType; label: string; desc: string; emoji: string }[] = [
  { id: "odev", label: "Ödev Sunumu", desc: "Üniversite ders ödevi", emoji: "🎓" },
  { id: "proje", label: "Proje Sunumu", desc: "TÜBİTAK / bitirme projesi", emoji: "🔬" },
  { id: "kobi", label: "KOBİ Tanıtımı", desc: "İşletme tanıtım sunumu", emoji: "🏪" },
  { id: "yatirimci", label: "Yatırımcı Sunumu", desc: "Pitch deck", emoji: "🚀" },
];

export const FONTS = ["Inter", "Poppins", "Montserrat", "Noto Sans"] as const;
