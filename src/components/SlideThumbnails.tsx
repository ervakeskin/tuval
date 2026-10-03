"use client";

import { useState } from "react";
import type { Brand, Slide } from "@/lib/types";
import { SlideCanvas } from "./SlideCanvas";

type Props = {
  slides: Slide[];
  brand: Brand;
  current: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onDelete: (i: number) => void;
  onDuplicate: (i: number) => void;
  onMove: (from: number, to: number) => void;
};

const THUMB_SCALE = 0.17;

export function SlideThumbnails({ slides, brand, current, onSelect, onAdd, onDelete, onDuplicate, onMove }: Props) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 overflow-y-auto p-3 space-y-3">
      {slides.map((s, i) => (
        <div
          key={s.id}
          draggable
          onDragStart={() => setDragFrom(i)}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(i);
          }}
          onDragEnd={() => {
            setDragFrom(null);
            setOver(null);
          }}
          onDrop={() => {
            if (dragFrom !== null && dragFrom !== i) onMove(dragFrom, i);
            setDragFrom(null);
            setOver(null);
          }}
          className={`group relative cursor-pointer rounded-lg ${over === i && dragFrom !== i ? "ring-2 ring-indigo-400" : ""}`}
          onClick={() => onSelect(i)}
        >
          <div className="flex gap-2">
            <span className="text-xs text-slate-400 w-4 pt-1">{i + 1}</span>
            <div
              className={`rounded-md overflow-hidden border-2 pointer-events-none ${
                i === current ? "border-indigo-500" : "border-slate-200"
              }`}
            >
              <SlideCanvas slide={s} brand={brand} scale={THUMB_SCALE} />
            </div>
          </div>
          <div className="absolute right-1 top-1 hidden group-hover:flex gap-1">
            <button
              title="Çoğalt"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(i);
              }}
              className="w-6 h-6 rounded bg-white/90 border border-slate-200 text-xs hover:bg-slate-100"
            >
              ⧉
            </button>
            <button
              title="Sil"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(i);
              }}
              className="w-6 h-6 rounded bg-white/90 border border-slate-200 text-xs hover:bg-red-50 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full h-10 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 hover:bg-slate-50"
      >
        + Slayt ekle
      </button>
    </aside>
  );
}
