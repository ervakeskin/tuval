# Tuval

Türk üniversite öğrencileri ve KOBİ'ler için **Türkçe öncelikli AI sunum aracı**.
Konuyu yaz, sunum tipini ve temayı seç; yapay zekâ tamamen **düzenlenebilir** bir slayt destesi kurar ve düzenlenebilir PPTX olarak dışa aktarır.

> Bu proje, YC Fall 2026 şirketi [Moda](https://www.ycombinator.com/companies/moda-2)'nın ("Fully editable slides, designs and video") yerelleştirilmiş bir klonudur. Ders ödevi için geliştirilmiştir; Moda ile bir bağı yoktur.

## Özellikler

- **Türkçe doğruluğu:** `İ/ı` kurallı büyük-küçük harf (`tr-TR`), `latin-ext` fontlar, Türkçe arayüz ve yönergeler.
- **Türkiye'ye özgü sunum tipleri:** ödev, TÜBİTAK/bitirme projesi, KOBİ tanıtımı, yatırımcı sunumu.
- **Düzen motoru:** Yapay zekâ koordinat üretmez; yalnızca düzen kalıbı ve içerik üretir. Koordinatları kod hesaplar, bu yüzden metin taşmaz. 11 düzen: başlık, bölüm, maddeler, iki sütun, büyük rakam, alıntı, görsel+metin, kartlar, yol haritası, vurgu cümlesi, kapanış.
- **7 özgün tema:** Klasik, Gece, Pastel, Minimal, Cesur, Anadolu (kilim şeritli), Kurumsal. Her tema gradyan kapak, süsler ve marka kitiyle özelleştirilir.
- **Tasarım ilkeleri koda gömülü:** ≥ 4,5:1 kontrast koruması, büyük başlıkta sıkı satır aralığı, slayt başına en fazla 5 madde, gruplama (chunking).
- **Editör:** sürükle/boyutlandır, yerinde metin düzenleme, slayt ekle/sil/çoğalt/sırala, kendi görselini ekle, AI ile slayt düzenleme, konuşmacı notları, sunum modu, tarayıcıda otomatik kayıt.
- **Dışa aktarma:** PowerPoint'te düzenlenebilir **PPTX** (metinler gerçek metin kutuları) ve PDF.

## Kurulum

```bash
npm install
cp .env.example .env.local   # GEMINI_API_KEY değerini doldur
npm run dev
```

[Google AI Studio](https://aistudio.google.com/apikey) üzerinden ücretsiz bir Gemini API anahtarı alabilirsin.
Anahtar yalnızca sunucu tarafında (`/api/*` route'ları) kullanılır, istemci paketine girmez.

| Değişken | Açıklama |
|---|---|
| `GEMINI_API_KEY` | Gemini API anahtarı (zorunlu) |
| `GEMINI_MODEL` | Ana model, varsayılan `gemini-flash-latest` |
| `GEMINI_FALLBACK_MODEL` | Ana model yoğunken (503/429) denenen yedek, varsayılan `gemini-flash-lite-latest` |

## Mimari

```
prompt ──► /api/generate (Gemini) ──► DeckContent (düzen + içerik)
                                         │
                                  layoutEngine (kod)
                                         ▼
                              Deck (elemanlar + koordinatlar) ──► Tuval / PPTX / PDF
```

- `src/lib/layoutEngine.ts` — düzen kalıpları ve koordinat hesabı
- `src/lib/themes.ts` — temalar, gradyan, kontrast yardımcıları
- `src/lib/gemini.ts` — yapılandırılmış JSON üretimi, yeniden deneme ve yedek model
- `src/lib/exportPptx.ts`, `src/lib/exportPdf.ts` — dışa aktarma
- Veritabanı yok; desteler `localStorage`'da saklanır.

## Teknoloji

Next.js (App Router) · TypeScript · Tailwind CSS · Gemini API (`@google/genai`) · react-rnd · pptxgenjs · html-to-image + jsPDF

## Kapsam dışı (yol haritası)

Video/animasyon, gerçek zamanlı ortak çalışma, kullanıcı hesabı, görsel üretimi, Instagram carousel, Google Slides'a aktarma.
