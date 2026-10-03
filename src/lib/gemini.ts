import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { LAYOUT_NAMES, type DeckContent, type SlideContent } from "./types";

const columnSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    heading: { type: Type.STRING },
    bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["heading", "bullets"],
};

const slideProps: Record<string, Schema> = {
  layout: { type: Type.STRING, enum: LAYOUT_NAMES },
  title: { type: Type.STRING },
  subtitle: { type: Type.STRING },
  bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
  left: columnSchema,
  right: columnSchema,
  number: { type: Type.STRING },
  caption: { type: Type.STRING },
  quote: { type: Type.STRING },
  author: { type: Type.STRING },
  icon: { type: Type.STRING },
  items: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: { heading: { type: Type.STRING }, text: { type: Type.STRING } },
      required: ["heading", "text"],
    },
  },
  notes: { type: Type.STRING },
};

export const slideSchema: Schema = {
  type: Type.OBJECT,
  properties: slideProps,
  required: ["layout", "title"],
};

export const deckSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    slides: { type: Type.ARRAY, items: slideSchema },
  },
  required: ["title", "slides"],
};

export class RateLimitError extends Error {}
export class ModelError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 429 (istek sınırı) ve 503 (model yoğun) geçici hatalardır. */
function isTransient(e: unknown): boolean {
  const err = e as { status?: number; code?: number; message?: string };
  return (
    err?.status === 429 ||
    err?.status === 503 ||
    err?.code === 429 ||
    err?.code === 503 ||
    /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE|high demand|quota/i.test(err?.message ?? "")
  );
}

async function callJson<T>(system: string, user: string, schema: Schema): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ModelError("GEMINI_API_KEY tanımlı değil.");
  const ai = new GoogleGenAI({ apiKey });
  const primary = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const fallback = process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest";

  const run = (model: string, fast = true) =>
    ai.models.generateContent({
      model,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8,
        // hız: düşünme kapalı (bazı modeller bu ayarı reddeder → aşağıda ayarsız denenir)
        ...(fast ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        httpOptions: { timeout: 25_000 },
      },
    });

  // Ana model yoğunsa hemen yedek modele geç, sonra bir tur daha dene
  const attempts: [string, number][] = [
    [primary, 0],
    [fallback, 0],
    [primary, 2500],
    [fallback, 2500],
  ];
  let res;
  let lastErr: unknown;
  for (const [model, wait] of attempts) {
    if (wait) await sleep(wait);
    const t0 = Date.now();
    try {
      try {
        res = await run(model);
      } catch (e) {
        if (!/INVALID_ARGUMENT|400/.test((e as Error).message)) throw e;
        res = await run(model, false);
      }
      console.log(`[gemini] ${model} ok ${Date.now() - t0}ms`);
      break;
    } catch (e) {
      lastErr = e;
      console.warn(`[gemini] ${model} hata ${Date.now() - t0}ms: ${(e as Error).message.slice(0, 120)}`);
      if (!isTransient(e)) throw new ModelError((e as Error).message);
    }
  }
  if (!res) {
    console.error("[gemini] tüm denemeler başarısız:", (lastErr as Error)?.message);
    throw new RateLimitError("busy");
  }
  const raw = res.text ?? "";
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ModelError("Model geçerli bir JSON döndürmedi.");
  }
}

export function generateDeckContent(system: string, user: string) {
  return callJson<DeckContent>(system, user, deckSchema);
}

export function editSlideContent(system: string, user: string) {
  return callJson<SlideContent>(system, user, slideSchema);
}
