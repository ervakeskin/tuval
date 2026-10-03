"use client";

import type { SlideElement } from "@/lib/types";

type Props = {
  el: SlideElement | null;
  onChange: (patch: Partial<SlideElement>) => void;
  onDelete: () => void;
};

const btn = "h-8 min-w-8 px-2 rounded-md border border-slate-200 text-sm hover:bg-slate-100";
const on = "bg-indigo-100 border-indigo-300 text-indigo-700";

export function Toolbar({ el, onChange, onDelete }: Props) {
  if (!el) {
    return <div className="h-12 flex items-center px-4 text-sm text-slate-400">Bir öğe seçin · metni düzenlemek için çift tıklayın</div>;
  }
  const isText = el.type === "text" && el.style;
  const st = el.style!;
  const setStyle = (p: Partial<NonNullable<SlideElement["style"]>>) => onChange({ style: { ...st, ...p } });

  return (
    <div className="h-12 flex items-center gap-2 px-4">
      {isText && (
        <>
          <button className={btn} onClick={() => setStyle({ fontSize: Math.max(8, st.fontSize - 2) })}>
            A−
          </button>
          <input
            type="number"
            value={st.fontSize}
            onChange={(e) => setStyle({ fontSize: Math.max(8, +e.target.value || 8) })}
            className="h-8 w-16 rounded-md border border-slate-200 px-2 text-sm"
          />
          <button className={btn} onClick={() => setStyle({ fontSize: st.fontSize + 2 })}>
            A+
          </button>
          <input
            type="color"
            value={st.color}
            onChange={(e) => setStyle({ color: e.target.value })}
            className="h-8 w-8 rounded-md border border-slate-200 cursor-pointer"
            title="Renk"
          />
          <button className={`${btn} font-bold ${st.bold ? on : ""}`} onClick={() => setStyle({ bold: !st.bold })}>
            B
          </button>
          <button className={`${btn} italic ${st.italic ? on : ""}`} onClick={() => setStyle({ italic: !st.italic })}>
            I
          </button>
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              className={`${btn} ${(st.align ?? "left") === a ? on : ""}`}
              onClick={() => setStyle({ align: a })}
              title={a}
            >
              {a === "left" ? "⇤" : a === "center" ? "↔" : "⇥"}
            </button>
          ))}
        </>
      )}
      {el.type === "shape" && (
        <input
          type="color"
          value={el.fill ?? "#000000"}
          onChange={(e) => onChange({ fill: e.target.value })}
          className="h-8 w-8 rounded-md border border-slate-200 cursor-pointer"
          title="Dolgu rengi"
        />
      )}
      <button className={`${btn} ml-auto text-red-600 hover:bg-red-50`} onClick={onDelete}>
        Sil
      </button>
    </div>
  );
}
