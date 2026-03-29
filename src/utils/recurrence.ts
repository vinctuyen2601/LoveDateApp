import { Event } from '../types';
import { lunarService } from '../services/lunar.service';

function resolveBaseDate(event: Event): Date {
  const date = new Date(event.eventDate);
  if (event.isLunarCalendar) {
    try {
      return lunarService.convertEventDate(date, true);
    } catch (err) {
      console.error(`Lunar conversion failed for "${event.title}", using solar date:`, err);
      return date;
    }
  }
  return date;
}

/**
 * Tìm tất cả ngày xảy ra của event trong cửa sổ [windowStart, windowEnd].
 * Xử lý đúng: once, yearly (solar + lunar), weekly, monthly.
 */
export function getOccurrencesInWindow(
  event: Event,
  windowStart: Date,
  windowEnd: Date,
): Date[] {
  const base = resolveBaseDate(event);
  const patternType =
    event.recurrencePattern?.type ?? (event.isRecurring ? 'yearly' : 'once');
  const results: Date[] = [];

  const startDay = new Date(windowStart);
  startDay.setHours(0, 0, 0, 0);

  const addIfInWindow = (d: Date) => {
    const candidate = new Date(d);
    candidate.setHours(0, 0, 0, 0);
    if (candidate >= startDay && candidate <= windowEnd) {
      results.push(candidate);
    }
  };

  switch (patternType) {
    case 'once': {
      addIfInWindow(base);
      break;
    }

    case 'yearly': {
      const currentYear = windowStart.getFullYear();
      if (event.isLunarCalendar) {
        const { month: lunarMonth, day: lunarDay } =
          lunarService.extractLunarCoordinates(new Date(event.eventDate));
        // Start from -1: lunar month 12 of (year-1) often falls in Jan/Feb of
        // the window year, so we must check the previous lunar year too.
        for (let offset = -1; offset <= 2; offset++) {
          const solarDate = lunarService.lunarToSolarForYear(lunarMonth, lunarDay, currentYear + offset);
          if (solarDate) addIfInWindow(solarDate);
        }
      } else {
        for (let offset = 0; offset <= 2; offset++) {
          const d = new Date(base);
          d.setFullYear(currentYear + offset);
          addIfInWindow(d);
        }
      }
      break;
    }

    case 'weekly': {
      const targetDay = event.recurrencePattern?.dayOfWeek ?? base.getDay();
      const cursor = new Date(windowStart);
      cursor.setHours(12, 0, 0, 0);
      // Advance to first occurrence of targetDay on or after windowStart
      while (cursor.getDay() !== targetDay) {
        cursor.setDate(cursor.getDate() + 1);
      }
      while (cursor <= windowEnd) {
        results.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 7);
      }
      break;
    }

    case 'monthly': {
      const targetDayOfMonth = event.recurrencePattern?.dayOfMonth ?? base.getDate();
      const cursor = new Date(windowStart);
      cursor.setDate(1);
      cursor.setHours(12, 0, 0, 0);
      while (cursor <= windowEnd) {
        const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
        const day = Math.min(targetDayOfMonth, daysInMonth);
        addIfInWindow(new Date(cursor.getFullYear(), cursor.getMonth(), day, 12, 0, 0, 0));
        cursor.setMonth(cursor.getMonth() + 1);
      }
      break;
    }
  }

  return results;
}

/** Trả về true nếu event xảy ra vào đúng ngày date (bỏ qua giờ). */
export function occursOnDate(event: Event, date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const dayStart = new Date(d);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(d);
  dayEnd.setHours(23, 59, 59, 999);
  return getOccurrencesInWindow(event, dayStart, dayEnd).length > 0;
}

/** Trả về tất cả ngày xảy ra của event trong tháng (month 0-based). */
export function getOccurrencesInMonth(event: Event, year: number, month: number): Date[] {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return getOccurrencesInWindow(event, start, end);
}

/** Trả về ngày xảy ra gần nhất của event từ fromDate trở đi (hoặc null). */
export function getNextOccurrence(event: Event, fromDate: Date): Date | null {
  const end = new Date(fromDate);
  end.setFullYear(end.getFullYear() + 1); // tìm trong 1 năm tới
  const occurrences = getOccurrencesInWindow(event, fromDate, end);
  return occurrences.length > 0 ? occurrences[0] : null;
}
