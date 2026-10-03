"use client";

import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import type { SlideElement } from "@/lib/types";
import { fontFamily } from "@/lib/fonts";

type Props = {
  el: SlideElement;
  scale: number;
  editable: boolean;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<SlideElement>) => void;
};

function content(el: SlideElement) {
  if (el.type === "shape")
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: el.fill,
          opacity: el.opacity ?? 1,
          borderRadius: el.shape === "ellipse" ? "50%" : el.shape === "round" ? 20 : undefined,
          boxShadow: el.shadow ? "0 8px 24px rgba(0,0,0,0.14)" : undefined,
        }}
      />
    );
  if (el.type === "image")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={el.src} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />;
  return null;
}

const textCss = (el: SlideElement): React.CSSProperties => ({
  width: "100%",
  height: "100%",
  fontFamily: el.font ? fontFamily(el.font) : undefined,
  fontSize: el.style?.fontSize,
  color: el.style?.color,
  fontWeight: el.style?.bold ? 700 : 400,
  fontStyle: el.style?.italic ? "italic" : "normal",
  textAlign: el.style?.align ?? "left",
  lineHeight: el.style?.lineHeight ?? 1.3,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  overflow: "hidden",
  outline: "none",
});

/** Madde listesi: her satır başında "•". Metin saklanırken madde işareti yok, yalnızca \n. */
function BulletsView({ el }: { el: SlideElement }) {
  const lines = (el.text ?? "").split("\n").filter((l) => l.trim() !== "");
  return (
    <div style={textCss(el)}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", gap: "0.6em", marginBottom: "0.35em" }}>
          <span style={{ color: "inherit", opacity: 0.7 }}>•</span>
          <span style={{ flex: 1 }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

function TextView({ el, editing, onCommit }: { el: SlideElement; editing: boolean; onCommit: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const r = document.createRange();
      r.selectNodeContents(ref.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
    }
  }, [editing]);

  if (!editing) {
    if (el.role === "bullets") return <BulletsView el={el} />;
    return <div style={textCss(el)}>{el.text}</div>;
  }
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={() => onCommit(ref.current?.innerText.replace(/\n+$/, "") ?? "")}
      onKeyDown={(e) => {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        e.stopPropagation();
      }}
      style={{ ...textCss(el), overflow: "auto", cursor: "text" }}
    >
      {el.text}
    </div>
  );
}

export function SlideElementView({ el, scale, editable, selected, onSelect, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const isText = el.type === "text";

  const inner = isText ? (
    <TextView
      el={el}
      editing={editing}
      onCommit={(t) => {
        setEditing(false);
        if (t !== el.text) onChange({ text: t });
      }}
    />
  ) : (
    content(el)
  );

  if (!editable || el.locked) {
    return (
      <div
        style={{
          position: "absolute",
          left: el.x,
          top: el.y,
          width: el.w,
          height: el.h,
          pointerEvents: el.locked ? "none" : undefined,
        }}
      >
        {inner}
      </div>
    );
  }

  return (
    <Rnd
      scale={scale}
      size={{ width: el.w, height: el.h }}
      position={{ x: el.x, y: el.y }}
      bounds="parent"
      disableDragging={editing}
      enableResizing={selected && !editing}
      cancel={editing ? "*" : undefined}
      onMouseDown={(e: MouseEvent) => {
        e.stopPropagation();
        onSelect();
      }}
      onDragStop={(_, d) => onChange({ x: Math.round(d.x), y: Math.round(d.y) })}
      onResizeStop={(_, __, ref, ___, pos) =>
        onChange({
          w: Math.round(parseFloat(ref.style.width)),
          h: Math.round(parseFloat(ref.style.height)),
          x: Math.round(pos.x),
          y: Math.round(pos.y),
        })
      }
      onDoubleClick={() => isText && setEditing(true)}
      style={{
        outline: selected ? "2px solid #6366f1" : undefined,
        outlineOffset: 2,
        cursor: editing ? "text" : "move",
        zIndex: selected ? 10 : 1,
      }}
      resizeHandleStyles={
        selected
          ? Object.fromEntries(
              ["topLeft", "topRight", "bottomLeft", "bottomRight"].map((k) => [
                k,
                { width: 14, height: 14, background: "#6366f1", borderRadius: 7, border: "2px solid white" },
              ])
            )
          : undefined
      }
    >
      {inner}
    </Rnd>
  );
}
