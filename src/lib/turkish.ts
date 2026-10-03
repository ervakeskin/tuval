// Türkçe'ye duyarlı harf dönüşümleri. Kodda yerleşik toUpperCase()/toLowerCase() kullanılmaz.
export const trUpper = (s: string) => s.toLocaleUpperCase("tr-TR");
export const trLower = (s: string) => s.toLocaleLowerCase("tr-TR");

export const trTitleCase = (s: string) =>
  trLower(s).replace(/(^|\s|[-(])(\p{L})/gu, (_, sep: string, ch: string) => sep + trUpper(ch));
