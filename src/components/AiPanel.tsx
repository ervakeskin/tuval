"use client";

import { useState } from "react";
import type { Slide } from "@/lib/types";

type Props = {
  slide: Slide;
  onAi: (instruction: string) => Promise<string | null>; // hata mesajı veya null
  onNotes: (notes: string) => void;
};

const QUICK = ["Kısalt", "Madde madde yap", "Daha resmi", "Daha samimi"];

export function AiPanel({ slide, onAi, onNotes }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(instruction: string) {
    if (!instruction.trim() || busy) return;
    setBusy(true);
    setError("");
    const err = await onAi(instruction);
    setBusy(false);
    if (err) setError(err);
    else setText("");
  }

  return (
    <aside className="w-72 shrink-0 bg-white border-l border-slate-200 overflow-y-auto p-4 space-y-5">
      <section>
        <h3 className="font-semibold text-sm mb-2">✨ AI ile düzenle</h3>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              disabled={busy}
              onClick={() => run(q)}
              className="px-3 h-8 rounded-full border border-slate-200 text-sm hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              run(text);
            }
          }}
          rows={3}
          placeholder="Örn. “Bir örnek ekle”"
          className="mt-3 w-full rounded-lg border border-slate-200 p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={() => run(text)}
          disabled={busy || !text.trim()}
          className="mt-2 w-full h-9 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-indigo-700"
        >
          {busy ? "Düzenleniyor…" : "Uygula"}
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <p className="mt-2 text-xs text-slate-400">
          Not: AI düzenlemesi sonrası slayt kalıptan yeniden kurulur; elle yaptığınız taşıma/boyutlandırmalar sıfırlanır.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-sm mb-2">🎤 Konuşmacı notu</h3>
        <textarea
          key={slide.id}
          defaultValue={slide.notes ?? ""}
          onChange={(e) => onNotes(e.target.value)}
          rows={7}
          className="w-full rounded-lg border border-slate-200 p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </section>
    </aside>
  );
}
