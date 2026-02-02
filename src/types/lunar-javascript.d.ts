declare module 'lunar-javascript' {
  export class Solar {
    constructor(year: number, month: number, day: number);
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
  }

  export class Lunar {
    constructor(year: number, month: number, day: number, isLeapMonth?: number);
    static fromYmd(year: number, month: number, day: number, isLeapMonth?: number): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    isLeapMonth(): boolean;
    getSolar(): Solar;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
  }

  export class LunarUtil {
    static MONTH_NAME: string[];
    static DAY_NAME: string[];
  }
}
