import Lunar from 'lunar-javascript';
import { LunarDate, SolarDate } from '../types';

class LunarService {
  /**
   * Convert solar date to lunar date
   */
  solarToLunar(solar: SolarDate): LunarDate {
    const lunar = Lunar.Solar.fromYmd(solar.year, solar.month, solar.day).getLunar();

    return {
      day: lunar.getDay(),
      month: lunar.getMonth(),
      year: lunar.getYear(),
      isLeapMonth: lunar.isLeapMonth(),
    };
  }

  /**
   * Convert lunar date to solar date
   */
  lunarToSolar(lunar: LunarDate): SolarDate {
    const lunarObj = Lunar.Lunar.fromYmd(
      lunar.year,
      lunar.month,
      lunar.day,
      lunar.isLeapMonth ? 1 : 0
    );
    const solar = lunarObj.getSolar();

    return {
      day: solar.getDay(),
      month: solar.getMonth(),
      year: solar.getYear(),
    };
  }

  /**
   * Get lunar date from JS Date object
   */
  jsDateToLunar(date: Date): LunarDate {
    return this.solarToLunar({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    });
  }

  /**
   * Get solar Date object from lunar date
   */
  lunarToJsDate(lunar: LunarDate): Date {
    const solar = this.lunarToSolar(lunar);
    return new Date(solar.year, solar.month - 1, solar.day);
  }

  /**
   * Format lunar date as string
   */
  formatLunarDate(lunar: LunarDate): string {
    const leapText = lunar.isLeapMonth ? ' (nhuận)' : '';
    return `${lunar.day}/${lunar.month}/${lunar.year} ÂL${leapText}`;
  }

  /**
   * Get next occurrence of lunar date (in solar calendar)
   */
  getNextLunarOccurrence(lunar: LunarDate): Date {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Try this year first
    let testLunar = { ...lunar, year: currentYear };
    let solar = this.lunarToSolar(testLunar);
    let solarDate = new Date(solar.year, solar.month - 1, solar.day);

    // If date has passed this year, use next year
    if (solarDate < now) {
      testLunar = { ...lunar, year: currentYear + 1 };
      solar = this.lunarToSolar(testLunar);
      solarDate = new Date(solar.year, solar.month - 1, solar.day);
    }

    return solarDate;
  }

  /**
   * Get lunar date display text
   */
  getLunarDateDisplay(date: Date): string {
    const lunar = this.jsDateToLunar(date);
    return this.formatLunarDate(lunar);
  }

  /**
   * Check if a lunar date exists in a year (handle leap months)
   */
  isValidLunarDate(lunar: LunarDate): boolean {
    try {
      const solar = this.lunarToSolar(lunar);
      return solar.day > 0 && solar.month > 0 && solar.year > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get current lunar date
   */
  getCurrentLunarDate(): LunarDate {
    return this.jsDateToLunar(new Date());
  }

  /**
   * Convert event date based on calendar type
   */
  convertEventDate(date: Date, isLunarCalendar: boolean): Date {
    if (!isLunarCalendar) {
      return date;
    }

    // If it's lunar calendar, get the next occurrence
    const lunar = this.jsDateToLunar(date);
    return this.getNextLunarOccurrence(lunar);
  }
}

// Export singleton instance
export const lunarService = new LunarService();
