"use client";

import { useMemo } from "react";
import { THEMES, getTheme } from "@/lib/themes";
import { buildSlide } from "@/lib/layoutEngine";
import type { Brand, ThemeId } from "@/lib/types";
import { SlideCanvas } from "./SlideCanvas";

/** Her kart, temanın kendi varsayılan renkleriyle gerçek bir başlık slaydı önizler. */
export function ThemePicker({ value, onPick }: { value: ThemeId; onPick: (id: ThemeId) => void }) {
  const previews = useMemo(
    () =>
      THEMES.map((t) => {
        const brand: Brand = { ...t.defaults, theme: t.id };
        return {
          t,
          brand,
          slide: buildSlide({ layout: "title", title: "İstanbul'dan Merhaba", subtitle: "Şişli · Çağlayan" }, brand),
        };
      }),
    []
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {previews.map(({ t, brand, slide }) => (
        <button
          key={t.id}
          onClick={() => onPick(t.id)}
          className={`text-left rounded-xl border p-2 transition ${
            value === t.id ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="rounded-md overflow-hidden border border-slate-200 pointer-events-none">
            <SlideCanvas slide={slide} brand={brand} scale={0.14} />
          </div>
          <div className="mt-2 text-sm font-semibold">{getTheme(t.id).name}</div>
          <div className="text-xs text-slate-500">{t.desc}</div>
        </button>
      ))}
    </div>
  );
}
