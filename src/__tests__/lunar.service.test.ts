import { lunarService } from '../services/lunar.service';

// ─── lunarToSolar ────────────────────────────────────────────────────────────

describe('lunarService.lunarToSolar', () => {
  it('converts a known lunar date to correct solar date', () => {
    // Lunar 1/1/2000 (Canh Thin new year) → Solar 5/2/2000
    const solar = lunarService.lunarToSolar({ year: 2000, month: 1, day: 1, isLeapMonth: false });
    expect(solar).toEqual({ year: 2000, month: 2, day: 5 });
  });

  it('lunar 12/12/1994 → solar crosses into 1995', () => {
    // Lunar month 12 of 1994 starts in Jan 1995
    const solar = lunarService.lunarToSolar({ year: 1994, month: 12, day: 12, isLeapMonth: false });
    expect(solar.year).toBe(1995);
    expect(solar.month).toBe(1);
  });

  it('lunar 1/3/2000 → solar is in April 2000', () => {
    const solar = lunarService.lunarToSolar({ year: 2000, month: 3, day: 1, isLeapMonth: false });
    expect(solar.year).toBe(2000);
    expect(solar.month).toBe(4);
  });
});

// ─── extractLunarCoordinates ─────────────────────────────────────────────────

describe('lunarService.extractLunarCoordinates', () => {
  it('reads month/day directly from Date object (does NOT convert solar→lunar)', () => {
    // The stored eventDate for lunar 1/3/2000 is new Date(2000, 2, 1) = March 1
    const stored = new Date(2000, 2, 1, 12, 0, 0);
    const coords = lunarService.extractLunarCoordinates(stored);
    expect(coords).toEqual({ month: 3, day: 1 });
  });

  it('lunar 12/12 stored as Dec 12 → extracts month=12, day=12', () => {
    const stored = new Date(1994, 11, 12, 12, 0, 0);
    const coords = lunarService.extractLunarCoordinates(stored);
    expect(coords).toEqual({ month: 12, day: 12 });
  });
});

// ─── lunarToSolarForYear ─────────────────────────────────────────────────────

describe('lunarService.lunarToSolarForYear', () => {
  it('lunar 3/1 in year 2026 returns a solar date', () => {
    const date = lunarService.lunarToSolarForYear(3, 1, 2026);
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
  });

  it('lunar 3/1 in year 2027 returns a solar date', () => {
    const date = lunarService.lunarToSolarForYear(3, 1, 2027);
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2027);
  });

  it('round-trips: extractLunarCoordinates(stored) → lunarToSolarForYear gives same result each year', () => {
    // Simulates how recurrence.ts uses the stored eventDate
    const stored = new Date(2000, 2, 1, 12, 0, 0); // encoded lunar 1/3
    const { month, day } = lunarService.extractLunarCoordinates(stored);
    expect(month).toBe(3);
    expect(day).toBe(1);

    const solar2026 = lunarService.lunarToSolarForYear(month, day, 2026);
    const solar2027 = lunarService.lunarToSolarForYear(month, day, 2027);

    // Both should be valid dates in their respective years
    expect(solar2026).not.toBeNull();
    expect(solar2027).not.toBeNull();
    expect(solar2026!.getFullYear()).toBe(2026);
    expect(solar2027!.getFullYear()).toBe(2027);

    // The solar month should stay close to lunar month 3 (≈ April in most years)
    expect(solar2026!.getMonth()).toBeGreaterThanOrEqual(2); // >= March
    expect(solar2026!.getMonth()).toBeLessThanOrEqual(4);    // <= May
    expect(solar2027!.getMonth()).toBeGreaterThanOrEqual(2);
    expect(solar2027!.getMonth()).toBeLessThanOrEqual(4);
  });
});

// ─── solarToLunar round-trip ─────────────────────────────────────────────────

describe('lunarService round-trip: lunarToSolar → solarToLunar', () => {
  it('converts lunar 15/7/2025 to solar and back', () => {
    const lunar = { year: 2025, month: 7, day: 15, isLeapMonth: false };
    const solar = lunarService.lunarToSolar(lunar);
    const back = lunarService.solarToLunar(solar);
    expect(back.month).toBe(lunar.month);
    expect(back.day).toBe(lunar.day);
  });
});
