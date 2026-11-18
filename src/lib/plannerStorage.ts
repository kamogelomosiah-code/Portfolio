/**
 * Calendar notes are stored in this browser's localStorage, so they work
 * offline, survive reloads and server redeploys, and never need an API key.
 * Export / import gives a JSON backup to move notes between devices.
 */
import type { NotesState, CalendarNote } from "../components/ActionPlanner/ActionPlanner";

export const PLANNER_STORAGE_KEY = "kamo_planner_notes_v1";

function isNote(n: any): n is CalendarNote {
  return n && typeof n.id === "string" && typeof n.text === "string";
}

/** Keep only well-formed `{ "YYYY-MM-DD": CalendarNote[] }` entries. */
export function sanitizeNotes(raw: unknown): NotesState {
  const out: NotesState = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [key, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Array.isArray(list)) continue;
    const now = new Date().toISOString();
    const notes = list.filter(isNote).map((n: any) => ({
      id: n.id,
      text: n.text,
      done: Boolean(n.done),
      createdAt: typeof n.createdAt === "string" ? n.createdAt : now,
      updatedAt: typeof n.updatedAt === "string" ? n.updatedAt : now,
    }));
    if (notes.length) out[key] = notes;
  }
  return out;
}

/** Returns saved notes, or null if nothing has ever been saved on this device. */
export function loadLocalNotes(): NotesState | null {
  try {
    const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
    if (raw === null) return null;
    return sanitizeNotes(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Returns false if the browser refused to store (private mode, quota full). */
export function saveLocalNotes(notes: NotesState): boolean {
  try {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
}

/** One-time import of notes previously kept in the server's planner_notes.json. */
export async function fetchLegacyServerNotes(): Promise<NotesState> {
  try {
    const res = await fetch("/api/planner/notes", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return {};
    return sanitizeNotes(await res.json());
  } catch {
    return {};
  }
}

/** Merge two note sets by id; the newer `updatedAt` wins. */
export function mergeNotes(a: NotesState, b: NotesState): NotesState {
  const out: NotesState = { ...a };
  for (const [day, list] of Object.entries(b)) {
    const byId = new Map((out[day] || []).map((n) => [n.id, n]));
    for (const n of list) {
      const existing = byId.get(n.id);
      if (!existing || (n.updatedAt || "") > (existing.updatedAt || "")) byId.set(n.id, n);
    }
    out[day] = [...byId.values()];
  }
  return out;
}

export function countNotes(notes: NotesState): number {
  return Object.values(notes).reduce((sum, list) => sum + list.length, 0);
}

/** Download all notes as a JSON backup file. */
export function exportNotes(notes: NotesState) {
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `planner-notes-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read a backup file chosen by the user. Throws if it isn't valid notes JSON. */
export async function readNotesFile(file: File): Promise<NotesState> {
  const parsed = JSON.parse(await file.text());
  const notes = sanitizeNotes(parsed);
  if (countNotes(notes) === 0) throw new Error("No calendar notes found in that file");
  return notes;
}
