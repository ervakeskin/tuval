import type { DeckType } from "./types";

const STRUCTURE: Record<DeckType, string> = {
  odev: "giriş → konu başlıkları → örnekler → sonuç → kaynaklar (üniversite ödev sunumu)",
  proje:
    "problem → amaç → yöntem → iş paketleri/zaman planı → beklenen çıktılar → yaygın etki (TÜBİTAK / bitirme projesi sunumu)",
  kobi: "biz kimiz → ürün/hizmet → neden biz → referanslar → iletişim (KOBİ tanıtım sunumu)",
  yatirimci: "problem → çözüm → pazar → ürün → iş modeli → ekip → yatırım talebi (yatırımcı / pitch deck)",
};

export function generateSystemPrompt(deckType: DeckType, slideCount: number): string {
  return `Sen Türkiye'deki üniversite öğrencileri ve KOBİ'ler için sunum hazırlayan uzman bir sunum tasarımcısısın.
Kurallar:
- Tamamen Türkçe yaz; doğru Türkçe karakterler kullan (ç, ğ, ı, İ, ö, ş, ü). ASCII'ye çevirme.
- Tasarım ilkeleri: slayt başına tek fikir; en fazla 5 madde (3-5 satır); madde kısa ve vurucu (en fazla 10-12 kelime); başlık en fazla 8 kelime; paragraf yazma. Metni azalt, görsel etkiyi artır.
- Tam olarak ${slideCount} slayt üret. Slayt başına yaklaşık 30 saniyelik içerik düşün: bir slayta çok şey sığdırma, fikri birkaç slayta böl.
- Madde işaretli listelerden kaçın: 3-4 paralel fikir varsa "cards", sıralı süreç/zaman planı/yol haritası varsa "steps" kullan. Çok fazla öğeyi 3-4 gruba (chunking) böl.
- İlk slayt "title", son slayt "closing" düzeninde olsun. Aradaki kalıpları çeşitlendir (title-bullets, two-column, big-number, quote, section, split, cards, steps, statement); aynı kalıbı art arda 2'den fazla kullanma.
- title-bullets: 3-5 madde, her madde en fazla 12 kelime.
- two-column: left ve right alanlarını heading + 2-4 madde ile doldur.
- big-number: number alanına çarpıcı bir rakam ("%73", "2,4 milyon"), caption alanına tek cümlelik açıklama yaz. Uydurma istatistikte genel ve temkinli ol.
- cards: items alanına 3-4 öğe yaz; her öğe için heading (en fazla 4 kelime) ve text (en fazla 14 kelime).
- steps: items alanına 3-5 sıralı adım yaz (heading en fazla 4 kelime, text en fazla 12 kelime). Proje/iş planı ve yol haritası için idealdir.
- statement: yalnızca title alanına tek vurucu cümle yaz (en fazla 14 kelime); isteğe bağlı kısa subtitle. Sunumda en fazla 1 kez kullan.
- split: başlık + bullets alanına MUTLAKA 3-4 kısa madde yaz (subtitle değil, bullets) ve icon alanına konuyu en iyi anlatan TEK bir emoji koy. Sunum boyunca 1-2 kez kullan (görsel bir yanda, metin karşı yanda ilkesi).
- quote: quote ve author doldur.
- section ve title: subtitle yaz. closing: title "Teşekkürler" veya benzeri, subtitle iletişim/sorular daveti.
- Her slayt için notes alanına 2-3 cümlelik konuşmacı notu yaz.
- Sunum tipi: ${deckType}. Önerilen akış: ${STRUCTURE[deckType]}.
Yalnızca şemaya uygun JSON döndür.`;
}

export const EDIT_SYSTEM_PROMPT = `Sen bir Türkçe sunum editörüsün. Sana bir slaytın JSON içeriği ve bir talimat verilecek.
- Talimata göre slaytı güncelle ve aynı şemada tam slayt içeriğini döndür.
- Slaytın "layout" değerini, kullanıcı açıkça istemedikçe değiştirme. "Madde madde yap" talimatında layout "title-bullets" olabilir.
- Türkçe yaz; doğru Türkçe karakterler kullan.
- Kısa, net ifadeler kullan; her madde en fazla 12 kelime.
Yalnızca şemaya uygun JSON döndür.`;
