/** Marka font adı → CSS font-family. (Değişkenler layout.tsx'te latin-ext ile yüklenir.) */
const MAP: Record<string, string> = {
  Inter: "var(--font-inter), Inter, sans-serif",
  Poppins: "var(--font-poppins), Poppins, sans-serif",
  Montserrat: "var(--font-montserrat), Montserrat, sans-serif",
  "Playfair Display": "var(--font-playfair), 'Playfair Display', Georgia, serif",
  "Noto Sans": "var(--font-noto), 'Noto Sans', sans-serif",
};

export const fontFamily = (name: string) => MAP[name] ?? MAP.Inter;
