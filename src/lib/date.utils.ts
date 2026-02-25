import { format, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isPast, isToday, isTomorrow, isThisWeek, isThisMonth, addDays, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CountdownInfo } from '../types';

export class DateUtils {
  /**
   * Format date to Vietnamese format
   */
  static formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: vi });
  }

  /**
   * Format datetime
   */
  static formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: vi });
  }

  /**
   * Get relative time (e.g., "2 ngày trước")
   */
  static getRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: vi });
  }

  /**
   * Calculate countdown to a date
   */
  static getCountdown(targetDate: Date | string): CountdownInfo {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const now = new Date();
    const targetStart = startOfDay(target);
    const nowStart = startOfDay(now);

    const isDatePast = isPast(targetStart) && !isToday(target);
    const days = Math.abs(differenceInDays(targetStart, nowStart));
    const hours = Math.abs(differenceInHours(target, now)) % 24;
    const minutes = Math.abs(differenceInMinutes(target, now)) % 60;
    const seconds = Math.abs(differenceInSeconds(target, now)) % 60;

    let displayText = '';
    if (isToday(target)) {
      displayText = 'Hôm nay!';
    } else if (isTomorrow(target)) {
      displayText = 'Ngày mai';
    } else if (days === 0) {
      displayText = `${hours} giờ ${minutes} phút`;
    } else if (days === 1) {
      displayText = isDatePast ? '1 ngày trước' : 'Còn 1 ngày';
    } else {
      displayText = isDatePast ? `${days} ngày trước` : `Còn ${days} ngày`;
    }

    return {
      isPast: isDatePast,
      days,
      hours,
      minutes,
      seconds,
      displayText,
    };
  }

  /**
   * Get days until event
   */
  static getDaysUntil(targetDate: Date | string): number {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const now = new Date();
    return differenceInDays(startOfDay(target), startOfDay(now));
  }

  /**
   * Check if date is today
   */
  static isToday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return isToday(dateObj);
  }

  /**
   * Check if date is this week
   */
  static isThisWeek(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return isThisWeek(dateObj, { locale: vi });
  }

  /**
   * Check if date is this month
   */
  static isThisMonth(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return isThisMonth(dateObj);
  }

  /**
   * Format date to YYYY-MM-DD string in local timezone
   * Use this instead of toISOString().split('T')[0] to avoid timezone issues
   */
  static toLocalDateString(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get today's date as YYYY-MM-DD string in local timezone
   */
  static getTodayString(): string {
    return DateUtils.toLocalDateString(new Date());
  }

  /**
   * Get reminder dates based on days before
   */
  static getReminderDates(eventDate: Date | string, daysBefore: number[]): Date[] {
    const event = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;
    return daysBefore.map(days => {
      const reminderDate = new Date(event);
      reminderDate.setDate(reminderDate.getDate() - days);
      reminderDate.setHours(9, 0, 0, 0); // 9:00 AM
      return reminderDate;
    });
  }

  /**
   * Get next occurrence of recurring event
   */
  static getNextOccurrence(eventDate: Date | string): Date {
    const event = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;
    const now = new Date();
    const currentYear = now.getFullYear();

    // Create date with current year
    const thisYearEvent = new Date(event);
    thisYearEvent.setFullYear(currentYear);

    // If event hasn't occurred this year, return this year's date
    if (thisYearEvent > now) {
      return thisYearEvent;
    }

    // Otherwise, return next year's date
    const nextYearEvent = new Date(event);
    nextYearEvent.setFullYear(currentYear + 1);
    return nextYearEvent;
  }

  /**
   * Group events by time period
   */
  static groupEventsByPeriod(events: Array<{ eventDate: string }>): {
    today: Array<{ eventDate: string }>;
    thisWeek: Array<{ eventDate: string }>;
    thisMonth: Array<{ eventDate: string }>;
    later: Array<{ eventDate: string }>;
  } {
    const today: Array<{ eventDate: string }> = [];
    const thisWeek: Array<{ eventDate: string }> = [];
    const thisMonth: Array<{ eventDate: string }> = [];
    const later: Array<{ eventDate: string }> = [];

    events.forEach(event => {
      const eventDate = new Date(event.eventDate);
      if (DateUtils.isToday(eventDate)) {
        today.push(event);
      } else if (DateUtils.isThisWeek(eventDate)) {
        thisWeek.push(event);
      } else if (DateUtils.isThisMonth(eventDate)) {
        thisMonth.push(event);
      } else {
        later.push(event);
      }
    });

    return { today, thisWeek, thisMonth, later };
  }

  /**
   * Convert to ISO string for storage
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Parse ISO string to Date
   */
  static fromISOString(isoString: string): Date {
    return new Date(isoString);
  }

  /**
   * Create date from components
   */
  static createDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  /**
   * Get date components
   */
  static getDateComponents(date: Date | string): { year: number; month: number; day: number } {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return {
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      day: dateObj.getDate(),
    };
  }

  /**
   * Check if two dates are the same day
   */
  static isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  /**
   * Get display text for event date
   */
  static getEventDateDisplay(eventDate: Date | string): string {
    const date = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;

    if (DateUtils.isToday(date)) {
      return 'Hôm nay';
    }
    if (isTomorrow(date)) {
      return 'Ngày mai';
    }
    if (DateUtils.isThisWeek(date)) {
      return format(date, 'EEEE, dd/MM', { locale: vi });
    }
    return DateUtils.formatDate(date);
  }
}
