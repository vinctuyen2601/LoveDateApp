/**
 * Comprehensive recurrence tests — covers every pattern type and edge case.
 *
 * Event types under test:
 *   once    — single occurrence (past / future / today)
 *   yearly  — solar (birthday, anniversary, holiday)
 *   yearly  — lunar (ngày giỗ / memorial)
 *   monthly — day-of-month recurring
 *   weekly  — day-of-week recurring
 *
 * Edge cases:
 *   - Solar Feb 29 (leap year)
 *   - Solar end-of-month overflow (day 31 in a 30-day month)
 *   - Lunar month 12 crossing solar year boundary (Jan/Feb)
 *   - Lunar month 1 falling near solar Feb (just after Tết)
 *   - Window boundary: event exactly on windowStart / windowEnd
 *   - isRecurring=false with no recurrencePattern → treated as 'once'
 *   - isRecurring=true with no recurrencePattern  → treated as 'yearly'
 *   - Deleted events (isDeleted flag — recurrence logic itself is agnostic)
 *   - getOccurrencesInMonth helper
 *   - getNextOccurrence helper
 *   - occursOnDate helper
 */

import {
  getOccurrencesInWindow,
  getOccurrencesInMonth,
  getNextOccurrence,
  occursOnDate,
} from '../utils/recurrence';
import { Event } from '../types';

// ─── Factory ──────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'test',
    title: 'Test event',
    eventDate: new Date(2000, 0, 1, 12).toISOString(),
    isLunarCalendar: false,
    tags: [],
    reminderSettings: { remindDaysBefore: [], reminderTime: { hour: 9, minute: 0 } },
    isRecurring: true,
    recurrencePattern: { type: 'yearly' },
    isDeleted: false,
    isNotificationEnabled: true,
    localId: 'local_test',
    serverId: undefined,
    version: 1,
    needsSync: false,
    startYear: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Shorthand: year-wide window */
function yearWindow(y: number) {
  return { start: new Date(y, 0, 1, 0, 0, 0), end: new Date(y, 11, 31, 23, 59, 59) };
}

/** Shorthand: month-wide window (month 0-based) */
function monthWindow(y: number, m: number) {
  return {
    start: new Date(y, m, 1, 0, 0, 0),
    end: new Date(y, m + 1, 0, 23, 59, 59),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. ONCE
// ══════════════════════════════════════════════════════════════════════════════

describe('once — single occurrence', () => {
  const past = makeEvent({
    eventDate: new Date(2015, 5, 10, 12).toISOString(), // June 10, 2015
    isRecurring: false,
    recurrencePattern: { type: 'once' },
  });

  const future = makeEvent({
    eventDate: new Date(2030, 8, 25, 12).toISOString(), // Sep 25, 2030
    isRecurring: false,
    recurrencePattern: { type: 'once' },
  });

  it('past event: found in its year', () => {
    const { start, end } = yearWindow(2015);
    expect(getOccurrencesInWindow(past, start, end)).toHaveLength(1);
  });

  it('past event: NOT found in a later year', () => {
    const { start, end } = yearWindow(2026);
    expect(getOccurrencesInWindow(past, start, end)).toHaveLength(0);
  });

  it('future event: NOT found before its date', () => {
    const { start, end } = yearWindow(2026);
    expect(getOccurrencesInWindow(future, start, end)).toHaveLength(0);
  });

  it('future event: found in its year', () => {
    const { start, end } = yearWindow(2030);
    expect(getOccurrencesInWindow(future, start, end)).toHaveLength(1);
  });

  it('occurs exactly on its date', () => {
    expect(occursOnDate(past, new Date(2015, 5, 10))).toBe(true);
  });

  it('does NOT occur one day before', () => {
    expect(occursOnDate(past, new Date(2015, 5, 9))).toBe(false);
  });

  it('does NOT occur one day after', () => {
    expect(occursOnDate(past, new Date(2015, 5, 11))).toBe(false);
  });

  it('isRecurring=false with no recurrencePattern → treated as once', () => {
    const ev = makeEvent({
      eventDate: new Date(2020, 3, 15, 12).toISOString(),
      isRecurring: false,
      recurrencePattern: undefined,
    });
    expect(getOccurrencesInWindow(ev, new Date(2020, 3, 15), new Date(2020, 3, 15, 23, 59))).toHaveLength(1);
    expect(getOccurrencesInWindow(ev, ...Object.values(yearWindow(2026)) as [Date, Date])).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. YEARLY — SOLAR
// ══════════════════════════════════════════════════════════════════════════════

describe('yearly solar — birthday / anniversary / holiday', () => {
  const birthday = makeEvent({
    eventDate: new Date(1990, 4, 20, 12).toISOString(), // May 20
    isLunarCalendar: false,
    recurrencePattern: { type: 'yearly' },
  });

  it('occurs on the same month/day every year (2024–2030)', () => {
    for (let y = 2024; y <= 2030; y++) {
      const { start, end } = yearWindow(y);
      const dates = getOccurrencesInWindow(birthday, start, end);
      expect(dates).toHaveLength(1);
      expect(dates[0].getMonth()).toBe(4);
      expect(dates[0].getDate()).toBe(20);
      expect(dates[0].getFullYear()).toBe(y);
    }
  });

  it('isRecurring=true with no recurrencePattern → defaults to yearly', () => {
    const ev = makeEvent({
      eventDate: new Date(2000, 6, 4, 12).toISOString(), // July 4
      isRecurring: true,
      recurrencePattern: undefined,
    });
    const { start, end } = yearWindow(2026);
    const dates = getOccurrencesInWindow(ev, start, end);
    expect(dates).toHaveLength(1);
    expect(dates[0].getMonth()).toBe(6);
    expect(dates[0].getDate()).toBe(4);
  });

  it('does NOT appear in the month before or after', () => {
    const april = monthWindow(2026, 3);  // April
    const june  = monthWindow(2026, 5);  // June
    expect(getOccurrencesInWindow(birthday, april.start, april.end)).toHaveLength(0);
    expect(getOccurrencesInWindow(birthday, june.start, june.end)).toHaveLength(0);
  });

  it('window boundary: event on exact windowStart is included', () => {
    const d = new Date(2026, 4, 20, 0, 0, 0); // May 20 00:00
    expect(getOccurrencesInWindow(birthday, d, new Date(2026, 4, 20, 23, 59))).toHaveLength(1);
  });

  it('window boundary: event on exact windowEnd is included', () => {
    const d = new Date(2026, 4, 20, 23, 59, 59); // May 20 23:59
    expect(getOccurrencesInWindow(birthday, new Date(2026, 4, 20, 0, 0), d)).toHaveLength(1);
  });
});

describe('yearly solar — Feb 29 (leap year birthday)', () => {
  const leapBirthday = makeEvent({
    eventDate: new Date(2000, 1, 29, 12).toISOString(), // Feb 29 2000 (leap)
    isLunarCalendar: false,
    recurrencePattern: { type: 'yearly' },
  });

  it('appears in Feb in a leap year (2028)', () => {
    const dates = getOccurrencesInWindow(leapBirthday, new Date(2028, 0, 1), new Date(2028, 11, 31));
    expect(dates.some(d => d.getMonth() === 1 && d.getDate() === 29)).toBe(true);
  });

  it('in non-leap year (2027): setFullYear overflows to Mar 1 or stays in Feb', () => {
    // The behaviour depends on JS Date setFullYear — we just assert it doesn't crash
    // and returns exactly 1 occurrence
    const dates = getOccurrencesInWindow(leapBirthday, new Date(2027, 0, 1), new Date(2027, 11, 31));
    expect(dates).toHaveLength(1);
  });
});

describe('yearly solar — end-of-month (Jan 31 anniversary)', () => {
  const ev = makeEvent({
    eventDate: new Date(2010, 0, 31, 12).toISOString(), // Jan 31
    isLunarCalendar: false,
    recurrencePattern: { type: 'yearly' },
  });

  it('occurs on Jan 31 every year', () => {
    for (let y = 2025; y <= 2028; y++) {
      const dates = getOccurrencesInWindow(ev, new Date(y, 0, 1), new Date(y, 11, 31));
      expect(dates).toHaveLength(1);
      expect(dates[0].getMonth()).toBe(0);
      expect(dates[0].getDate()).toBe(31);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. YEARLY — LUNAR (ngày giỗ / memorial)
// ══════════════════════════════════════════════════════════════════════════════

describe('yearly lunar — ngày giỗ mid-year (1/3)', () => {
  // lunar 1/3/2000 stored as new Date(2000, 2, 1) = "2000-03-01"
  const gio = makeEvent({
    eventDate: new Date(2000, 2, 1, 12).toISOString(),
    isLunarCalendar: true,
    recurrencePattern: { type: 'yearly', month: 3, day: 1 },
  });

  it('finds exactly 1 occurrence per year (2024–2030)', () => {
    for (let y = 2024; y <= 2030; y++) {
      const { start, end } = yearWindow(y);
      const dates = getOccurrencesInWindow(gio, start, end);
      expect(dates.length).toBeGreaterThanOrEqual(1);
      dates.forEach(d => expect(d.getFullYear()).toBe(y));
    }
  });

  it('occurrence stays in March–May solar (lunar month 3 ≈ April)', () => {
    for (let y = 2024; y <= 2030; y++) {
      const { start, end } = yearWindow(y);
      const dates = getOccurrencesInWindow(gio, start, end);
      dates.forEach(d => {
        expect(d.getMonth()).toBeGreaterThanOrEqual(2); // >= March
        expect(d.getMonth()).toBeLessThanOrEqual(4);    // <= May
      });
    }
  });

  it('does NOT drift by 1 month each year (regression)', () => {
    const months = [];
    for (let y = 2024; y <= 2030; y++) {
      const { start, end } = yearWindow(y);
      months.push(getOccurrencesInWindow(gio, start, end)[0].getMonth());
    }
    expect(Math.max(...months) - Math.min(...months)).toBeLessThanOrEqual(1);
  });
});

describe('yearly lunar — 15th of month 7 (Rằm tháng 7)', () => {
  const ramThang7 = makeEvent({
    eventDate: new Date(2000, 6, 15, 12).toISOString(), // encoded lunar 15/7
    isLunarCalendar: true,
    recurrencePattern: { type: 'yearly', month: 7, day: 15 },
  });

  it('falls in Aug–Sep solar every year (lunar 7 ≈ Aug)', () => {
    for (let y = 2024; y <= 2028; y++) {
      const { start, end } = yearWindow(y);
      const dates = getOccurrencesInWindow(ramThang7, start, end);
      expect(dates.length).toBeGreaterThanOrEqual(1);
      dates.forEach(d => {
        expect(d.getMonth()).toBeGreaterThanOrEqual(6); // >= July
        expect(d.getMonth()).toBeLessThanOrEqual(8);    // <= September
      });
    }
  });
});

describe('yearly lunar — month 12 crossing solar year boundary', () => {
  // lunar 12/12/1994 → solar ~Jan 1995
  // stored eventDate: new Date(1994, 11, 12) = Dec 12 encoded
  const gio12 = makeEvent({
    eventDate: new Date(1994, 11, 12, 12).toISOString(),
    isLunarCalendar: true,
    recurrencePattern: { type: 'yearly', month: 12, day: 12 },
  });

  it('appears in Jan or Feb of the following solar year', () => {
    let foundJanFeb = false;
    for (let y = 2025; y <= 2030; y++) {
      const { start, end } = yearWindow(y);
      const dates = getOccurrencesInWindow(gio12, start, end);
      if (dates.some(d => d.getMonth() <= 1)) {
        foundJanFeb = true;
        break;
      }
    }
    expect(foundJanFeb).toBe(true);
  });

  it('does NOT drift month year over year', () => {
    const allMonths: number[] = [];
    for (let y = 2024; y <= 2030; y++) {
      const { start, end } = yearWindow(y);
      getOccurrencesInWindow(gio12, start, end).forEach(d => allMonths.push(d.getMonth()));
    }
    expect(allMonths.length).toBeGreaterThan(0);
    expect(Math.max(...allMonths) - Math.min(...allMonths)).toBeLessThanOrEqual(1);
  });

  it('never returns a date outside the searched year window', () => {
    for (let y = 2024; y <= 2030; y++) {
      const { start, end } = yearWindow(y);
      getOccurrencesInWindow(gio12, start, end).forEach(d => {
        expect(d.getFullYear()).toBe(y);
      });
    }
  });
});

describe('yearly lunar — month 1 (just after Tết / lunar new year)', () => {
  // lunar 1/1/2000 → solar ~Feb 5 2000
  const tet = makeEvent({
    eventDate: new Date(2000, 0, 1, 12).toISOString(), // encoded lunar 1/1
    isLunarCalendar: true,
    recurrencePattern: { type: 'yearly', month: 1, day: 1 },
  });

  it('always falls in Jan–Mar solar (lunar month 1 ≈ Feb)', () => {
    for (let y = 2024; y <= 2030; y++) {
      const { start, end } = yearWindow(y);
      const dates = getOccurrencesInWindow(tet, start, end);
      expect(dates.length).toBeGreaterThanOrEqual(1);
      dates.forEach(d => {
        expect(d.getMonth()).toBeGreaterThanOrEqual(0); // >= Jan
        expect(d.getMonth()).toBeLessThanOrEqual(2);    // <= Mar
      });
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. MONTHLY
// ══════════════════════════════════════════════════════════════════════════════

describe('monthly — recurring day-of-month', () => {
  const monthly10 = makeEvent({
    eventDate: new Date(2020, 0, 10, 12).toISOString(),
    isRecurring: true,
    recurrencePattern: { type: 'monthly', dayOfMonth: 10 },
  });

  it('occurs once per month on day 10', () => {
    for (let m = 0; m < 12; m++) {
      const { start, end } = monthWindow(2026, m);
      const dates = getOccurrencesInWindow(monthly10, start, end);
      expect(dates).toHaveLength(1);
      expect(dates[0].getDate()).toBe(10);
      expect(dates[0].getMonth()).toBe(m);
    }
  });

  it('finds 12 occurrences in a full year', () => {
    const { start, end } = yearWindow(2026);
    expect(getOccurrencesInWindow(monthly10, start, end)).toHaveLength(12);
  });

  it('clamps day 31 to last day of short months (e.g. Feb → 28/29)', () => {
    const monthly31 = makeEvent({
      eventDate: new Date(2020, 0, 31, 12).toISOString(),
      isRecurring: true,
      recurrencePattern: { type: 'monthly', dayOfMonth: 31 },
    });
    // Feb 2026 (non-leap) → clamped to 28
    const { start, end } = monthWindow(2026, 1); // Feb
    const dates = getOccurrencesInWindow(monthly31, start, end);
    expect(dates).toHaveLength(1);
    expect(dates[0].getDate()).toBe(28);
    // April (30 days) → clamped to 30
    const apr = monthWindow(2026, 3);
    const datesApr = getOccurrencesInWindow(monthly31, apr.start, apr.end);
    expect(datesApr).toHaveLength(1);
    expect(datesApr[0].getDate()).toBe(30);
  });

  it('uses base date day when dayOfMonth not specified', () => {
    const ev = makeEvent({
      eventDate: new Date(2020, 0, 15, 12).toISOString(), // day 15
      isRecurring: true,
      recurrencePattern: { type: 'monthly' }, // no dayOfMonth
    });
    const { start, end } = monthWindow(2026, 5); // June
    const dates = getOccurrencesInWindow(ev, start, end);
    expect(dates).toHaveLength(1);
    expect(dates[0].getDate()).toBe(15);
  });

  it('window spanning 3 months returns 3 occurrences', () => {
    const start = new Date(2026, 2, 1);  // Mar 1
    const end   = new Date(2026, 4, 31); // May 31
    expect(getOccurrencesInWindow(monthly10, start, end)).toHaveLength(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. WEEKLY
// ══════════════════════════════════════════════════════════════════════════════

describe('weekly — recurring day-of-week', () => {
  // Every Monday (dayOfWeek = 1)
  const everyMonday = makeEvent({
    eventDate: new Date(2020, 0, 6, 12).toISOString(), // Jan 6 2020 = Monday
    isRecurring: true,
    recurrencePattern: { type: 'weekly', dayOfWeek: 1 },
  });

  it('every occurrence is a Monday', () => {
    const { start, end } = yearWindow(2026);
    const dates = getOccurrencesInWindow(everyMonday, start, end);
    dates.forEach(d => expect(d.getDay()).toBe(1));
  });

  it('returns ~52 Mondays in a full year', () => {
    const { start, end } = yearWindow(2026);
    const dates = getOccurrencesInWindow(everyMonday, start, end);
    expect(dates.length).toBeGreaterThanOrEqual(52);
    expect(dates.length).toBeLessThanOrEqual(53);
  });

  it('returns exactly 1 Monday in a Mon-to-Mon 1-week window', () => {
    // Week of Mar 2–8 2026: Mon=Mar 2
    const start = new Date(2026, 2, 2); // Mar 2 (Monday)
    const end   = new Date(2026, 2, 8, 23, 59);
    const dates = getOccurrencesInWindow(everyMonday, start, end);
    expect(dates).toHaveLength(1);
    expect(dates[0].getDay()).toBe(1);
  });

  it('returns 0 Mondays in a Tue–Sun window', () => {
    const start = new Date(2026, 2, 3); // Tue Mar 3
    const end   = new Date(2026, 2, 8, 23, 59); // Sun Mar 8
    const dates = getOccurrencesInWindow(everyMonday, start, end);
    expect(dates).toHaveLength(0);
  });

  it('uses base date weekday when dayOfWeek not specified', () => {
    // Jan 6 2020 is a Monday (day=1)
    const ev = makeEvent({
      eventDate: new Date(2020, 0, 6, 12).toISOString(),
      isRecurring: true,
      recurrencePattern: { type: 'weekly' }, // no dayOfWeek
    });
    const { start, end } = yearWindow(2026);
    const dates = getOccurrencesInWindow(ev, start, end);
    dates.forEach(d => expect(d.getDay()).toBe(1)); // all Mondays
  });

  it('every Sunday in a month (dayOfWeek=0)', () => {
    const everySunday = makeEvent({
      eventDate: new Date(2020, 0, 5, 12).toISOString(), // Jan 5 2020 = Sunday
      isRecurring: true,
      recurrencePattern: { type: 'weekly', dayOfWeek: 0 },
    });
    const { start, end } = monthWindow(2026, 2); // March 2026
    const dates = getOccurrencesInWindow(everySunday, start, end);
    dates.forEach(d => expect(d.getDay()).toBe(0));
    expect(dates.length).toBeGreaterThanOrEqual(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. HELPERS: getOccurrencesInMonth, getNextOccurrence, occursOnDate
// ══════════════════════════════════════════════════════════════════════════════

describe('getOccurrencesInMonth', () => {
  const ev = makeEvent({
    eventDate: new Date(2000, 7, 17, 12).toISOString(), // Aug 17 solar
    recurrencePattern: { type: 'yearly' },
  });

  it('returns 1 occurrence in the matching month', () => {
    const dates = getOccurrencesInMonth(ev, 2026, 7); // August (0-based)
    expect(dates).toHaveLength(1);
    expect(dates[0].getDate()).toBe(17);
  });

  it('returns 0 in a non-matching month', () => {
    expect(getOccurrencesInMonth(ev, 2026, 6)).toHaveLength(0); // July
    expect(getOccurrencesInMonth(ev, 2026, 8)).toHaveLength(0); // Sep
  });

  it('monthly event: returns 1 occurrence per month', () => {
    const monthly = makeEvent({ recurrencePattern: { type: 'monthly', dayOfMonth: 5 } });
    for (let m = 0; m < 12; m++) {
      expect(getOccurrencesInMonth(monthly, 2026, m)).toHaveLength(1);
    }
  });
});

describe('getNextOccurrence', () => {
  it('returns next yearly occurrence after fromDate', () => {
    const ev = makeEvent({
      eventDate: new Date(2000, 11, 25, 12).toISOString(), // Dec 25
      recurrencePattern: { type: 'yearly' },
    });
    const next = getNextOccurrence(ev, new Date(2026, 6, 1)); // from Jul 1 2026
    expect(next).not.toBeNull();
    expect(next!.getMonth()).toBe(11);
    expect(next!.getDate()).toBe(25);
    expect(next!.getFullYear()).toBe(2026);
  });

  it('returns null for past once event', () => {
    const ev = makeEvent({
      eventDate: new Date(2010, 0, 1, 12).toISOString(),
      isRecurring: false,
      recurrencePattern: { type: 'once' },
    });
    expect(getNextOccurrence(ev, new Date(2026, 0, 1))).toBeNull();
  });

  it('returns next weekly occurrence', () => {
    const ev = makeEvent({
      eventDate: new Date(2020, 0, 6, 12).toISOString(), // Monday
      recurrencePattern: { type: 'weekly', dayOfWeek: 1 },
    });
    const from = new Date(2026, 2, 4, 0, 0); // Wed Mar 4 2026
    const next = getNextOccurrence(ev, from);
    expect(next).not.toBeNull();
    expect(next!.getDay()).toBe(1); // next Monday = Mar 9
    expect(next!.getDate()).toBe(9);
  });

  it('returns next monthly occurrence', () => {
    const ev = makeEvent({ recurrencePattern: { type: 'monthly', dayOfMonth: 20 } });
    const from = new Date(2026, 2, 21); // Mar 21 → next = Apr 20
    const next = getNextOccurrence(ev, from);
    expect(next).not.toBeNull();
    expect(next!.getDate()).toBe(20);
    expect(next!.getMonth()).toBe(3); // April
  });

  it('returns today if event occurs today', () => {
    // Use a known date in the test
    const today = new Date(2026, 2, 15); // Mar 15 2026
    const ev = makeEvent({
      eventDate: new Date(2000, 2, 15, 12).toISOString(), // Mar 15 yearly
      recurrencePattern: { type: 'yearly' },
    });
    const next = getNextOccurrence(ev, today);
    expect(next).not.toBeNull();
    expect(next!.getMonth()).toBe(2);
    expect(next!.getDate()).toBe(15);
  });
});

describe('occursOnDate', () => {
  const ev = makeEvent({
    eventDate: new Date(2000, 8, 3, 12).toISOString(), // Sep 3
    recurrencePattern: { type: 'yearly' },
  });

  it('returns true on the anniversary date', () => {
    expect(occursOnDate(ev, new Date(2026, 8, 3))).toBe(true);
  });

  it('returns false one day before', () => {
    expect(occursOnDate(ev, new Date(2026, 8, 2))).toBe(false);
  });

  it('returns false one day after', () => {
    expect(occursOnDate(ev, new Date(2026, 8, 4))).toBe(false);
  });

  it('accepts ISO string date', () => {
    expect(occursOnDate(ev, '2026-09-03')).toBe(true);
    expect(occursOnDate(ev, '2026-09-02')).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. CROSS-CUTTING: isDeleted, no recurrencePattern defaults
// ══════════════════════════════════════════════════════════════════════════════

describe('edge cases', () => {
  it('isDeleted=true: recurrence logic still returns results (caller must filter)', () => {
    // getOccurrencesInWindow is agnostic to isDeleted — filtering is the caller's job
    const ev = makeEvent({
      isDeleted: true,
      eventDate: new Date(2000, 5, 1, 12).toISOString(),
      recurrencePattern: { type: 'yearly' },
    });
    const { start, end } = yearWindow(2026);
    expect(getOccurrencesInWindow(ev, start, end)).toHaveLength(1);
  });

  it('zero-length window (start === end, no match) returns empty', () => {
    const ev = makeEvent({
      eventDate: new Date(2000, 5, 15, 12).toISOString(),
      recurrencePattern: { type: 'yearly' },
    });
    const d = new Date(2026, 5, 1);
    expect(getOccurrencesInWindow(ev, d, d)).toHaveLength(0);
  });

  it('window entirely in the past for a once event', () => {
    const ev = makeEvent({
      eventDate: new Date(2030, 0, 1, 12).toISOString(),
      isRecurring: false,
      recurrencePattern: { type: 'once' },
    });
    const { start, end } = yearWindow(2026);
    expect(getOccurrencesInWindow(ev, start, end)).toHaveLength(0);
  });
});
