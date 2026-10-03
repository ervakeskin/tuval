"use client";

import { useEffect, useState } from "react";
import { CANVAS_H, CANVAS_W } from "@/lib/config";
import type { Brand, Slide } from "@/lib/types";
import { SlideCanvas } from "./SlideCanvas";

export function PresentMode({
  slides,
  brand,
  start,
  onClose,
}: {
  slides: Slide[];
  brand: Brand;
  start: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(start);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H));
    fit();
    window.addEventListener("resize", fit);
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      window.removeEventListener("resize", fit);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(e.key)) setI((v) => Math.min(slides.length - 1, v + 1));
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) setI((v) => Math.max(0, v - 1));
    };
    const onFs = () => {
      if (!document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [slides.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setI((v) => Math.min(slides.length - 1, v + 1))}>
      <SlideCanvas slide={slides[i]} brand={brand} scale={scale} />
      <div className="absolute bottom-3 right-4 text-xs text-white/50">
        {i + 1} / {slides.length} · Esc: çık
      </div>
    </div>
  );
}
