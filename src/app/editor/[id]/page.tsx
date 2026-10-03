"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CANVAS_H, CANVAS_W } from "@/lib/config";
import { buildSlide, recoverContent } from "@/lib/layoutEngine";
import { loadDeck, saveDeck } from "@/lib/storage";
import type { Deck, Slide, SlideElement, ThemeId } from "@/lib/types";
import { THEMES, getTheme } from "@/lib/themes";
import { exportPptx } from "@/lib/exportPptx";
import { exportPdf } from "@/lib/exportPdf";
import { SlideCanvas } from "@/components/SlideCanvas";
import { SlideThumbnails } from "@/components/SlideThumbnails";
import { Toolbar } from "@/components/Toolbar";
import { AiPanel } from "@/components/AiPanel";
import { PresentMode } from "@/components/PresentMode";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [missing, setMissing] = useState(false);
  const [cur, setCur] = useState(0);
  const [selId, setSelId] = useState<string | null>(null);
  const [present, setPresent] = useState(false);
  const [busy, setBusy] = useState<"" | "pptx" | "pdf">("");
  const [scale, setScale] = useState(0.6);
  const stageRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    const d = loadDeck(id);
    // localStorage yalnızca istemcide okunabilir
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (d) setDeck(d);
    else setMissing(true);
    loaded.current = true;
  }, [id]);

  // debounce'lu otomatik kayıt
  useEffect(() => {
    if (!deck || !loaded.current) return;
    const t = setTimeout(() => saveDeck(deck), 400);
    return () => clearTimeout(t);
  }, [deck]);

  // tuvali alana sığdır (deste yüklenince sahne DOM'a girer)
  const ready = deck !== null;
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () =>
      setScale(Math.max(0.2, Math.min((el.clientWidth - 64) / CANVAS_W, (el.clientHeight - 32) / CANVAS_H)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  const slide: Slide | undefined = deck?.slides[cur];
  const selected = slide?.elements.find((e) => e.id === selId) ?? null;

  const mutate = useCallback((fn: (d: Deck) => Deck) => setDeck((d) => (d ? fn(d) : d)), []);

  const updateSlide = useCallback(
    (i: number, fn: (s: Slide) => Slide) =>
      mutate((d) => ({ ...d, slides: d.slides.map((s, k) => (k === i ? fn(s) : s)) })),
    [mutate]
  );

  const patchElement = useCallback(
    (elId: string, patch: Partial<SlideElement>) =>
      updateSlide(cur, (s) => ({ ...s, elements: s.elements.map((e) => (e.id === elId ? { ...e, ...patch } : e)) })),
    [cur, updateSlide]
  );

  const deleteSelected = useCallback(() => {
    if (!selId) return;
    updateSlide(cur, (s) => ({ ...s, elements: s.elements.filter((e) => e.id !== selId) }));
    setSelId(null);
  }, [selId, cur, updateSlide]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selId) {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selId, deleteSelected]);

  if (missing)
    return (
      <div className="p-10 text-center">
        <p className="mb-4">Sunum bulunamadı.</p>
        <Link href="/" className="text-indigo-600 underline">
          Ana sayfaya dön
        </Link>
      </div>
    );
  if (!deck || !slide) return <div className="p-10 text-center text-slate-500">Yükleniyor…</div>;

  const addSlide = () => {
    const s = buildSlide({ layout: "title-bullets", title: "Yeni slayt", bullets: ["İlk madde", "İkinci madde"] }, deck.brand);
    mutate((d) => ({ ...d, slides: [...d.slides.slice(0, cur + 1), s, ...d.slides.slice(cur + 1)] }));
    setCur(cur + 1);
    setSelId(null);
  };

  const deleteSlide = (i: number) => {
    if (deck.slides.length <= 1) return;
    mutate((d) => ({ ...d, slides: d.slides.filter((_, k) => k !== i) }));
    setCur(Math.min(cur, deck.slides.length - 2));
    setSelId(null);
  };

  const duplicateSlide = (i: number) => {
    const src = deck.slides[i];
    const copy: Slide = {
      ...structuredClone(src),
      id: crypto.randomUUID(),
      elements: src.elements.map((e) => ({ ...structuredClone(e), id: crypto.randomUUID() })),
    };
    mutate((d) => ({ ...d, slides: [...d.slides.slice(0, i + 1), copy, ...d.slides.slice(i + 1)] }));
    setCur(i + 1);
  };

  const moveSlide = (from: number, to: number) => {
    mutate((d) => {
      const arr = [...d.slides];
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return { ...d, slides: arr };
    });
    setCur(to);
  };

  const aiEdit = async (instruction: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slide: recoverContent(slide), instruction }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Düzenleme başarısız.";
      const rebuilt = buildSlide(data.slide, deck.brand);
      updateSlide(cur, (old) => ({ ...rebuilt, id: old.id }));
      setSelId(null);
      return null;
    } catch {
      return "Bağlantı hatası. Lütfen tekrar deneyin.";
    }
  };

  /** Görseli en fazla 1200 px'e küçültüp JPEG/PNG data URL olarak slayta ekler. */
  const addImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1200 / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * k);
        cv.height = Math.round(img.height * k);
        cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
        const src = file.type === "image/png" ? cv.toDataURL("image/png") : cv.toDataURL("image/jpeg", 0.85);
        // en-boy oranını koruyarak sağ yarıya sığdır
        const r = Math.min(500 / img.width, 450 / img.height);
        const w = Math.round(img.width * r);
        const h = Math.round(img.height * r);
        const el: SlideElement = { id: crypto.randomUUID(), type: "image", x: 700 + Math.round((500 - w) / 2), y: 180 + Math.round((450 - h) / 2), w, h, src };
        updateSlide(cur, (s) => ({ ...s, elements: [...s.elements, el] }));
        setSelId(el.id);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const changeTheme = (themeId: ThemeId) => {
    if (themeId === deck.brand.theme) return;
    if (!confirm("Tema değişince tüm slaytlar yeniden kurulur; elle yaptığınız taşıma/boyutlandırmalar sıfırlanır. Devam edilsin mi?"))
      return;
    const brand = { ...deck.brand, ...getTheme(themeId).defaults, theme: themeId };
    mutate((d) => ({
      ...d,
      brand,
      slides: d.slides.map((s) => ({ ...buildSlide(recoverContent(s), brand), id: s.id })),
    }));
    setSelId(null);
  };

  const run = async (kind: "pptx" | "pdf") => {
    setBusy(kind);
    try {
      await (kind === "pptx" ? exportPptx(deck) : exportPdf(deck));
    } catch (e) {
      console.error(e);
      alert("Dışa aktarma sırasında bir hata oluştu.");
    }
    setBusy("");
  };

  const hbtn = "h-9 px-3 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-100 disabled:opacity-50";

  return (
    <div className="h-screen flex flex-col">
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-4">
        <Link href="/" className="text-slate-500 hover:text-slate-800 text-sm">
          ← Ana sayfa
        </Link>
        <input
          value={deck.title}
          onChange={(e) => mutate((d) => ({ ...d, title: e.target.value }))}
          className="flex-1 max-w-xl h-9 px-3 rounded-lg font-semibold hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
        />
        <div className="ml-auto flex gap-2">
          <select
            value={deck.brand.theme ?? "klasik"}
            onChange={(e) => changeTheme(e.target.value as ThemeId)}
            className={`${hbtn} bg-white`}
            title="Tema"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                Tema: {t.name}
              </option>
            ))}
          </select>
          <button className={hbtn} onClick={() => setPresent(true)}>
            ▶ Sunum modu
          </button>
          <button className={hbtn} disabled={!!busy} onClick={() => run("pdf")}>
            {busy === "pdf" ? "Hazırlanıyor…" : "PDF indir"}
          </button>
          <button
            className="h-9 px-3 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            disabled={!!busy}
            onClick={() => run("pptx")}
          >
            {busy === "pptx" ? "Hazırlanıyor…" : "PPTX indir"}
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <SlideThumbnails
          slides={deck.slides}
          brand={deck.brand}
          current={cur}
          onSelect={(i) => {
            setCur(i);
            setSelId(null);
          }}
          onAdd={addSlide}
          onDelete={deleteSlide}
          onDuplicate={duplicateSlide}
          onMove={moveSlide}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-slate-100">
          <div className="shrink-0 bg-white border-b border-slate-200 flex items-center">
            <div className="flex-1 min-w-0">
              <Toolbar el={selected} onChange={(p) => selId && patchElement(selId, p)} onDelete={deleteSelected} />
            </div>
            <label className="mr-4 h-8 px-3 rounded-md border border-slate-200 text-sm flex items-center cursor-pointer hover:bg-slate-100 shrink-0">
              🖼 Görsel ekle
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  addImage(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div ref={stageRef} className="flex-1 flex items-center justify-center overflow-hidden">
            <div className="shadow-lg">
              <SlideCanvas
                key={slide.id}
                slide={slide}
                brand={deck.brand}
                scale={scale}
                editable
                selectedId={selId}
                onSelect={setSelId}
                onChange={patchElement}
              />
            </div>
          </div>
        </main>

        <AiPanel
          slide={slide}
          onAi={aiEdit}
          onNotes={(notes) => updateSlide(cur, (s) => ({ ...s, notes }))}
        />
      </div>

      {present && <PresentMode slides={deck.slides} brand={deck.brand} start={cur} onClose={() => setPresent(false)} />}
    </div>
  );
}
