import { NextResponse } from "next/server";
import { generateDeckContent, ModelError, RateLimitError } from "@/lib/gemini";
import { generateSystemPrompt } from "@/lib/prompts";
import { sanitizeSlide } from "@/lib/sanitize";
import type { Brand, DeckType } from "@/lib/types";
import { buildDeckSlides } from "@/lib/layoutEngine";

export const maxDuration = 60;

const TYPES: DeckType[] = ["odev", "proje", "kobi", "yatirimci"];

export async function POST(req: Request) {
  let body: { prompt?: string; deckType?: DeckType; slideCount?: number; brand?: Brand };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) return NextResponse.json({ error: "Lütfen bir konu yazın." }, { status: 400 });
  const deckType: DeckType = TYPES.includes(body.deckType as DeckType) ? body.deckType! : "odev";
  const slideCount = Math.min(12, Math.max(4, Math.round(body.slideCount ?? 8)));
  const brand = body.brand;
  if (!brand?.primary) return NextResponse.json({ error: "Marka kiti eksik." }, { status: 400 });

  try {
    const content = await generateDeckContent(
      generateSystemPrompt(deckType, slideCount),
      `Sunum konusu / isteği: ${prompt}`
    );
    const contents = (content.slides ?? []).slice(0, 12).map(sanitizeSlide);
    if (contents.length === 0) throw new ModelError("Model slayt üretmedi.");
    contents[0].layout = "title";
    contents[contents.length - 1].layout = "closing";
    const slides = buildDeckSlides(contents, brand);
    return NextResponse.json({
      title: content.title || contents[0].title || "Yeni Sunum",
      slides,
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Yapay zekâ servisi şu an çok yoğun. Lütfen birkaç saniye sonra tekrar deneyin." },
        { status: 429 }
      );
    }
    console.error("[generate]", e);
    return NextResponse.json(
      { error: "Sunum üretilirken bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
