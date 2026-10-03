"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { BrandKitForm } from "@/components/BrandKitForm";
import { DECK_TYPES, type Brand, type Deck, type DeckType, type ThemeId } from "@/lib/types";
import { DEFAULT_THEME_FOR, getTheme } from "@/lib/themes";
import { ThemePicker } from "@/components/ThemePicker";
import { deleteDeck, listDecks, saveDeck } from "@/lib/storage";
import { trUpper } from "@/lib/turkish";

const EXAMPLES: Record<DeckType, string> = {
  odev: "Yapay zekânın eğitimde kullanımı",
  proje: "Bitirme projem için TÜBİTAK sunumu: akıllı tarım sensörleri",
  kobi: "İstanbul Şişli'de butik kahve dükkânı tanıtımı",
  yatirimci: "Esnaflar için yapay zekâ destekli stok takip uygulaması",
};

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [deckType, setDeckType] = useState<DeckType>("odev");
  const [slideCount, setSlideCount] = useState(8);
  const [brand, setBrand] = useState<Brand>({ ...getTheme("pastel").defaults, theme: "pastel" });
  const [themeTouched, setThemeTouched] = useState(false);

  const pickTheme = (id: ThemeId) => setBrand((b) => ({ ...b, ...getTheme(id).defaults, theme: id }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<Deck[]>([]);

  // localStorage yalnızca istemcide okunabilir
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setRecent(listDecks()), []);

  async function create() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, deckType, slideCount, brand }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bir hata oluştu.");
      const deck: Deck = {
        id: crypto.randomUUID(),
        title: data.title,
        deckType,
        brand,
        slides: data.slides,
        updatedAt: Date.now(),
      };
      saveDeck(deck);
      router.push(`/editor/${deck.id}`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl w-full mx-auto px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{trUpper(APP_NAME)}</h1>
        <p className="mt-2 text-slate-500">{APP_TAGLINE}</p>
      </header>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Sunumunun konusunu anlat… örn. "${EXAMPLES[deckType]}"`}
            rows={4}
            className="w-full rounded-xl border border-slate-200 p-4 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DECK_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setDeckType(t.id);
                if (!themeTouched) pickTheme(DEFAULT_THEME_FOR[t.id]); // sunum tipine uygun tema öner
              }}
              className={`text-left rounded-xl border p-3 transition ${
                deckType === t.id
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="text-2xl">{t.emoji}</div>
              <div className="font-semibold text-sm mt-1">{t.label}</div>
              <div className="text-xs text-slate-500">{t.desc}</div>
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Slayt sayısı: <b className="text-slate-800">{slideCount}</b>
          </label>
          <input
            type="range"
            min={5}
            max={12}
            value={slideCount}
            onChange={(e) => setSlideCount(+e.target.value)}
            className="w-full max-w-xs accent-indigo-600"
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2">Tema</h2>
          <ThemePicker
            value={brand.theme ?? "klasik"}
            onPick={(id) => {
              setThemeTouched(true);
              pickTheme(id);
            }}
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2">Marka kiti <span className="font-normal text-slate-400">(temanın renklerini özelleştir)</span></h2>
          <BrandKitForm brand={brand} onChange={setBrand} />
        </div>

        {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>}

        <button
          onClick={create}
          disabled={loading || !prompt.trim()}
          className="w-full h-12 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          {loading ? "Sunum hazırlanıyor… (10-15 sn)" : "Oluştur"}
        </button>
      </section>

      {recent.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold mb-3">Son sunumlar</h2>
          <ul className="grid md:grid-cols-2 gap-3">
            {recent.map((d) => (
              <li
                key={d.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between"
              >
                <Link href={`/editor/${d.id}`} className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.title}</div>
                  <div className="text-xs text-slate-500">
                    {d.slides.length} slayt · {new Date(d.updatedAt).toLocaleString("tr-TR")}
                  </div>
                </Link>
                <button
                  onClick={() => {
                    deleteDeck(d.id);
                    setRecent(listDecks());
                  }}
                  className="text-slate-400 hover:text-red-500 px-2"
                  title="Sil"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
