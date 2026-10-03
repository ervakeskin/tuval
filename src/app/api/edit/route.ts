import { NextResponse } from "next/server";
import { editSlideContent, RateLimitError } from "@/lib/gemini";
import { EDIT_SYSTEM_PROMPT } from "@/lib/prompts";
import { sanitizeSlide } from "@/lib/sanitize";
import type { SlideContent } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { slide?: SlideContent; instruction?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const instruction = (body.instruction ?? "").trim();
  if (!body.slide || !instruction)
    return NextResponse.json({ error: "Talimat boş olamaz." }, { status: 400 });

  try {
    const out = await editSlideContent(
      EDIT_SYSTEM_PROMPT,
      `Slayt içeriği:\n${JSON.stringify(body.slide)}\n\nTalimat: ${instruction}`
    );
    const clean = sanitizeSlide(out);
    // Kullanıcı kalıbı açıkça istemediyse mevcut kalıbı koru (model "title-bullets"e düşürmediyse)
    return NextResponse.json({ slide: { ...clean, notes: clean.notes ?? body.slide.notes } });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Yapay zekâ servisi şu an çok yoğun. Lütfen bir dakika bekleyip tekrar deneyin." },
        { status: 429 }
      );
    }
    console.error("[edit]", e);
    return NextResponse.json({ error: "Düzenleme sırasında bir hata oluştu." }, { status: 500 });
  }
}
