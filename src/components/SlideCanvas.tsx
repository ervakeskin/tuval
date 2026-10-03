"use client";

import { CANVAS_H, CANVAS_W } from "@/lib/config";
import { fontFamily } from "@/lib/fonts";
import type { Brand, Slide, SlideElement } from "@/lib/types";
import { SlideElementView } from "./SlideElementView";

type Props = {
  slide: Slide;
  brand: Brand;
  scale: number;
  /** Düzenleme modu: seçim, sürükleme, metin düzenleme. Yoksa salt-okunur (küçük resim / sunum / PDF). */
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, patch: Partial<SlideElement>) => void;
};

export function SlideCanvas({ slide, brand, scale, editable, selectedId, onSelect, onChange }: Props) {
  return (
    <div
      style={{
        width: CANVAS_W * scale,
        height: CANVAS_H * scale,
        position: "relative",
        overflow: editable ? "visible" : "hidden",
      }}
    >
      <div
        data-slide-root
        onMouseDown={() => editable && onSelect?.(null)}
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          background: slide.gradient
            ? `linear-gradient(${slide.gradient.angle}deg, ${slide.gradient.from}, ${slide.gradient.to})`
            : slide.background,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          overflow: "hidden",
          fontFamily: fontFamily(brand.font),
        }}
      >
        {slide.elements.map((el) => (
          <SlideElementView
            key={el.id}
            el={el}
            scale={scale}
            editable={!!editable}
            selected={selectedId === el.id}
            onSelect={() => onSelect?.(el.id)}
            onChange={(patch) => onChange?.(el.id, patch)}
          />
        ))}
      </div>
    </div>
  );
}
