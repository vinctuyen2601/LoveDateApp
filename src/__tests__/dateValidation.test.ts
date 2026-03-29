/**
 * Pure date validation logic — mirrors the 3-layer approach in AddYearlyEventScreen:
 *   Layer 1: isRangeValid  (no library)
 *   Layer 2: calendarDateString  (lunar: lunarToSolar, solar: format)
 *   Layer 3: isDateValid  (lunar: conversion ok?, solar: overflow check)
 */
import { lunarService } from '../services/lunar.service';

const CURRENT_YEAR = new Date().getFullYear();

function isRangeValid(day: number, month: number, year: number, isLunar: boolean): boolean {
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > CURRENT_YEAR) return false;
  const maxDay = isLunar ? 30 : 31;
  return day >= 1 && day <= maxDay;
}

function calendarDateString(day: number, month: number, year: number, isLunar: boolean): string | null {
  if (!isRangeValid(day, month, year, isLunar)) return null;
  if (isLunar) {
    try {
      const solar = lunarService.lunarToSolar({ year, month, day, isLeapMonth: false });
      return `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`;
    } catch {
      return null;
    }
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isDateValid(day: number, month: number, year: number, isLunar: boolean): boolean {
  if (!isRangeValid(day, month, year, isLunar)) return false;
  if (isLunar) {
    return calendarDateString(day, month, year, isLunar) !== null;
  }
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

// ─── Range validation ─────────────────────────────────────────────────────────

describe('isRangeValid', () => {
  describe('solar', () => {
    it('accepts valid dates', () => {
      expect(isRangeValid(1,  1, 2000, false)).toBe(true);
      expect(isRangeValid(31, 1, 2000, false)).toBe(true);
      expect(isRangeValid(28, 2, 2000, false)).toBe(true);
    });
    it('rejects day > 31', () => {
      expect(isRangeValid(32, 1, 2000, false)).toBe(false);
    });
    it('rejects month > 12', () => {
      expect(isRangeValid(1, 13, 2000, false)).toBe(false);
    });
    it('rejects year < 1900', () => {
      expect(isRangeValid(1, 1, 1899, false)).toBe(false);
    });
    it('rejects future year', () => {
      expect(isRangeValid(1, 1, CURRENT_YEAR + 1, false)).toBe(false);
    });
  });

  describe('lunar', () => {
    it('accepts valid lunar dates (max day 30)', () => {
      expect(isRangeValid(30, 1, 2000, true)).toBe(true);
      expect(isRangeValid(1, 12, 1994, true)).toBe(true);
    });
    it('rejects day 31 (lunar months max 30 days)', () => {
      expect(isRangeValid(31, 1, 2000, true)).toBe(false);
    });
  });
});

// ─── Solar day overflow ───────────────────────────────────────────────────────

describe('Solar date overflow (isDateValid)', () => {
  it('rejects Feb 30 solar', () => {
    expect(isDateValid(30, 2, 2000, false)).toBe(false);
  });
  it('rejects Feb 29 in non-leap year', () => {
    expect(isDateValid(29, 2, 2001, false)).toBe(false);
  });
  it('accepts Feb 29 in leap year', () => {
    expect(isDateValid(29, 2, 2000, false)).toBe(true);
  });
  it('rejects April 31 (April has only 30 days)', () => {
    expect(isDateValid(31, 4, 2000, false)).toBe(false);
  });
  it('accepts April 30', () => {
    expect(isDateValid(30, 4, 2000, false)).toBe(true);
  });
  it('rejects Nov 31', () => {
    expect(isDateValid(31, 11, 2000, false)).toBe(false);
  });
});

// ─── Lunar date validity ──────────────────────────────────────────────────────

describe('Lunar date validity (isDateValid)', () => {
  it('accepts valid lunar dates', () => {
    expect(isDateValid(1,  3, 2000, true)).toBe(true);
    expect(isDateValid(12, 12, 1994, true)).toBe(true);
    expect(isDateValid(15, 7,  2025, true)).toBe(true);
  });
  it('rejects day 0', () => {
    expect(isDateValid(0, 3, 2000, true)).toBe(false);
  });
  it('rejects day 31 (lunar max is 30)', () => {
    expect(isDateValid(31, 3, 2000, true)).toBe(false);
  });
});

// ─── calendarDateString for display ──────────────────────────────────────────

describe('calendarDateString', () => {
  it('solar: returns YYYY-MM-DD directly', () => {
    expect(calendarDateString(5, 8, 2025, false)).toBe('2025-08-05');
  });

  it('lunar 1/3/2000 → solar in April 2000', () => {
    const s = calendarDateString(1, 3, 2000, true);
    expect(s).not.toBeNull();
    expect(s!.startsWith('2000-04')).toBe(true);
  });

  it('lunar 12/12/1994 → solar in Jan 1995 (crosses year)', () => {
    const s = calendarDateString(12, 12, 1994, true);
    expect(s).not.toBeNull();
    expect(s!.startsWith('1995-01')).toBe(true);
  });

  it('returns null for invalid range', () => {
    expect(calendarDateString(0, 3, 2000, true)).toBeNull();
    expect(calendarDateString(1, 13, 2000, false)).toBeNull();
  });
});
