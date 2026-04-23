/**
 * aiEventNlu.service.ts
 * Natural Language Understanding helpers for the AI Event Creator.
 * All functions are pure (no React, no I/O) — fully unit-testable.
 */

import { API_BASE_URL } from '../constants/config';
import { EventFormData } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedEvent {
  eventType: string | null;
  personName: string | null;
  day: number | null;
  month: number | null;
  year: number | null;
  isLunar: boolean;
  rawText: string;
}

export const EMPTY_PARSED: ParsedEvent = {
  eventType: null,
  personName: null,
  day: null,
  month: null,
  year: null,
  isLunar: false,
  rawText: "",
};

// ─── NLU parser ───────────────────────────────────────────────────────────────

/**
 * Extract event fields from Vietnamese text.
 * Merges into `existing` so multi-turn corrections work:
 *   turn 1: "sinh nhật vợ"        → { eventType: birthday, personName: vợ }
 *   turn 2: "ngày 5 tháng 3"      → merges day/month
 *   turn 3: "ý tôi là ngày 15/3"  → overwrites day/month (rawText is new)
 */
export function parseVietnamese(
  text: string,
  existing: Partial<ParsedEvent> = {}
): ParsedEvent {
  const lower = text.toLowerCase();

  const result: ParsedEvent = {
    eventType: existing.eventType ?? null,
    personName: existing.personName ?? null,
    day: existing.day ?? null,
    month: existing.month ?? null,
    year: existing.year ?? null,
    isLunar: existing.isLunar ?? false,
    rawText: text,
  };

  // ── Event type ──
  if (!result.eventType) {
    if (/sinh\s*nh[aậ]t|\bsn\b/.test(lower)) result.eventType = "birthday";
    // "cưới" = c-ư-ớ-i, need two char classes for the vowel cluster
    else if (/k[ỷỉ]\s*ni[eệ]m|ng[aà]y\s*c[uư][oớ]i/.test(lower)) result.eventType = "anniversary";
    else if (/ng[aà]y\s*gi[oỗ]|gi[oỗ]\s+/.test(lower)) result.eventType = "memorial";
    else if (/s[uự]\s*ki[eệ]n|quan\s*tr[oọ]ng/.test(lower)) result.eventType = "other";
  }

  // ── Person name ──
  // Note: JS \b only works at ASCII word-char boundaries.
  // Vietnamese chars (ợ, ố, ẹ, ị, ô...) are non-\w, so we use
  // (?<!\w) / (?!\w) instead of \b where the boundary touches a Vietnamese char.
  if (!result.personName) {
    const KEYWORDS: Array<[RegExp, string]> = [
      [/(?<!\w)v[oợ](?!\w)/, "vợ"],
      [/\bch[oồ]ng\b/, "chồng"],                              // ends with ASCII 'g' → \b ok
      [/(?<!\w)b[oố](?!\w)|\bba\b|\bcha\b/, "bố"],
      [/(?<!\w)m[eẹ](?!\w)|\bma\b/, "mẹ"],
      [/(?<!\w)[oô]ng(?:\s+(?:n[oộ]i|ngo[aạ]i))?(?!\w)/, "ông nội"],
      [/\bb[aà](?:\s+(?:n[oộ]i|ngo[aạ]i))?/, "bà nội"],
      [/\bcon\s+g[aá]i/, "con gái"],
      [/\bcon\s+trai/, "con trai"],
      [/\bcon\b/, "con"],
      [/\banh\b/, "anh"],
      [/(?<!\w)ch[iị](?!\w)/, "chị"],
      [/\bem\b/, "em"],
      [/ng[uư][oờ]i\s*y[eê]u/, "người yêu"],
      [/ng[aà]y\s*c[uư][oớ]i/, "ngày cưới"],
    ];
    for (const [re, label] of KEYWORDS) {
      if (re.test(lower)) { result.personName = label; break; }
    }
    if (!result.personName) {
      // Tìm tên riêng: chữ hoa trong text gốc, loại trừ từ khóa đã biết
      const EXCLUDED = /^(Sinh|Nhật|Kỷ|Niệm|Ngày|Tháng|Năm|Giỗ|Sự|Kiện|Quan|Trọng|Cưới|Bạn|Anh|Chị|Em|Ông|Bà|Bố|Mẹ|Con|Vợ|Chồng|Âm|Lịch)$/;
      const caps = text.match(/\b[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐƠƯ][a-zàáâãèéêìíòóôõùúăđơưạảấầẩẫậắằẳẵặẹẻẽềếểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]+\b/g);
      if (caps) {
        const name = caps.find(w => !EXCLUDED.test(w));
        if (name) result.personName = `bạn ${name}`;
      }
    }
  }

  // ── Date — only overwrite if new text has a date ──
  const dateParsed = extractDate(lower);
  if (dateParsed) {
    result.day = dateParsed.day;
    result.month = dateParsed.month;
  }

  // ── Year ──
  if (!result.year) {
    const ym = lower.match(/(?:n[aă]m|sinh\s+n[aă]m)\s+(\d{4})|(\b(?:19|20)\d{2}\b)/);
    if (ym) {
      const y = parseInt(ym[1] || ym[2], 10);
      if (y >= 1900 && y <= new Date().getFullYear()) result.year = y;
    }
  }

  // ── Lunar calendar flag ──
  if (/[aâ]m\s*l[iị]ch/.test(lower)) result.isLunar = true;

  return result;
}

/** Extract day/month from Vietnamese date patterns. Returns null if not found. */
export function extractDate(lower: string): { day: number; month: number } | null {
  const patterns: Array<[RegExp, boolean]> = [
    [/ng[aà]y\s+(\d{1,2})\s+th[aá]ng\s+(\d{1,2})/, false],  // "ngày D tháng M"
    [/th[aá]ng\s+(\d{1,2})\s+ng[aà]y\s+(\d{1,2})/, true],   // "tháng M ngày D"
    [/(\d{1,2})\s+th[aá]ng\s+(\d{1,2})/, false],             // "D tháng M"
    [/\b(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.]\d{2,4})?\b/, false], // "D/M", "D-M" or "D.M"
  ];
  for (const [re, monthFirst] of patterns) {
    const m = lower.match(re);
    if (m) {
      return monthFirst
        ? { month: parseInt(m[1], 10), day: parseInt(m[2], 10) }
        : { day: parseInt(m[1], 10), month: parseInt(m[2], 10) };
    }
  }
  return null;
}

// ─── Slot completeness ────────────────────────────────────────────────────────

/** All mandatory fields filled → ready to show CONFIRM card */
export function isComplete(e: ParsedEvent): boolean {
  if (!e.eventType || !e.day || !e.month) return false;
  if (e.eventType !== 'other' && !e.personName) return false;
  return true;
}

/** Which slot is still missing → next question to ask */
export function getNextQuestion(e: ParsedEvent): string {
  if (!e.eventType)
    return "Đây là loại sự kiện gì vậy?\nSinh nhật, kỷ niệm, ngày giỗ, hay sự kiện khác?";
  if (!e.day || !e.month)
    return `${buildTitle(e)} vào ngày tháng nào?\nVí dụ: ngày 14 tháng 2, hoặc 5/3`;
  if (e.eventType !== 'other' && !e.personName)
    return `${buildTitle(e)} là của ai vậy?\nVí dụ: vợ, chồng, bạn Hùng, người yêu...`;
  return "Tuyệt! Tôi đã có đủ thông tin rồi.";
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function buildTitle(e: Partial<ParsedEvent>): string {
  const labels: Record<string, string> = {
    birthday: "Sinh nhật",
    anniversary: "Kỷ niệm",
    memorial: "Ngày giỗ",
    other: "Sự kiện",
  };
  if (e.personName === "ngày cưới") return "Ngày cưới";
  const base = labels[e.eventType ?? ""] ?? "Sự kiện";
  return e.personName ? `${base} ${e.personName}` : base;
}

// ─── AI Parser (via backend) ──────────────────────────────────────────────────

/**
 * Parse Vietnamese event text via backend /ai-agent/parse-event.
 * API key stays on server — never exposed in the app bundle.
 * Falls back to regex parser if backend is unreachable.
 */
export async function parseWithAI(
  text: string,
  existing: Partial<ParsedEvent> = {}
): Promise<ParsedEvent> {
  try {
    const res = await fetch(`${API_BASE_URL}/ai-agent/parse-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error(`parse-event ${res.status}`);
    const parsed = await res.json() as Partial<ParsedEvent>;
    console.log('[parseWithAI] response:', JSON.stringify(parsed));

    return {
      eventType:  parsed.eventType  ?? existing.eventType  ?? null,
      personName: parsed.personName ?? existing.personName ?? null,
      day:        parsed.day        ?? existing.day        ?? null,
      month:      parsed.month      ?? existing.month      ?? null,
      year:       parsed.year       ?? existing.year       ?? null,
      isLunar:    parsed.isLunar    ?? existing.isLunar    ?? false,
      rawText: text,
    };
  } catch {
    return parseVietnamese(text, existing);
  }
}

export function buildFormData(e: ParsedEvent): EventFormData {
  const year = new Date().getFullYear();
  return {
    title: buildTitle(e),
    eventDate: new Date(year, (e.month ?? 1) - 1, e.day ?? 1, 12, 0, 0, 0),
    isLunarCalendar: e.isLunar,
    tags: [e.eventType ?? "other"],
    remindDaysBefore: [0, 1, 7],
    reminderTime: { hour: 9, minute: 0 },
    isRecurring: true,
    startYear: e.year ?? undefined,
  };
}
