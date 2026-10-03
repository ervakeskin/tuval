"use client";

import type { Brand } from "@/lib/types";
import { FONTS } from "@/lib/types";
import { fontFamily } from "@/lib/fonts";

export function BrandKitForm({ brand, onChange }: { brand: Brand; onChange: (b: Brand) => void }) {
  const set = (p: Partial<Brand>) => onChange({ ...brand, ...p });

  const onLogo = (f?: File) => {
    if (!f) return;
    if (f.size > 500_000) {
      alert("Logo en fazla 500 KB olmalı.");
      return;
    }
    const r = new FileReader();
    r.onload = () => set({ logo: String(r.result) });
    r.readAsDataURL(f);
  };

  const label = "block text-xs font-medium text-slate-500 mb-1";
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <span className={label}>Ana renk</span>
        <input
          type="color"
          value={brand.primary}
          onChange={(e) => set({ primary: e.target.value })}
          className="h-10 w-full rounded-lg border border-slate-200 cursor-pointer"
        />
      </div>
      <div>
        <span className={label}>Vurgu rengi</span>
        <input
          type="color"
          value={brand.accent}
          onChange={(e) => set({ accent: e.target.value })}
          className="h-10 w-full rounded-lg border border-slate-200 cursor-pointer"
        />
      </div>
      <div>
        <span className={label}>Yazı tipi</span>
        <select
          value={brand.font}
          onChange={(e) => set({ font: e.target.value })}
          style={{ fontFamily: fontFamily(brand.font) }}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2"
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div>
        <span className={label}>Logo</span>
        <div className="flex items-center gap-2 h-10">
          <label className="flex-1 h-10 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 flex items-center justify-center cursor-pointer hover:bg-slate-100">
            {brand.logo ? "Değiştir" : "Yükle"}
            <input type="file" accept="image/*" hidden onChange={(e) => onLogo(e.target.files?.[0])} />
          </label>
          {brand.logo && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.logo} alt="logo" className="h-10 w-10 object-contain rounded border border-slate-200" />
              <button onClick={() => set({ logo: undefined })} className="text-slate-400 hover:text-red-500 text-lg">
                ×
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
