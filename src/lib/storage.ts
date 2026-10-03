import type { Deck } from "./types";

const KEY = "tuval:decks";

function readAll(): Record<string, Deck> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveDeck(deck: Deck) {
  const all = readAll();
  all[deck.id] = { ...deck, updatedAt: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // kota doldu (büyük logo vb.) — sessizce geç
  }
}

export function loadDeck(id: string): Deck | null {
  return readAll()[id] ?? null;
}

export function listDecks(): Deck[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteDeck(id: string) {
  const all = readAll();
  delete all[id];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}
