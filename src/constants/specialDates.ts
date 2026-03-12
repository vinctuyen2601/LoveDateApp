import { lunarService } from "../services/lunar.service";

// ─── Types ───

export interface SpecialDate {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  color: string;
  hint: string;
  /** Fixed solar month (1-12). Undefined for dynamic dates (lunar, nth-weekday). */
  month?: number;
  /** Fixed solar day (1-31). Undefined for dynamic dates. */
  day?: number;
  /** Lunar month (1-12). If set, `lunarDay` must also be set. */
  lunarMonth?: number;
  /** Lunar day (1-30). */
  lunarDay?: number;
  /** For "nth weekday of month" rules, e.g. Mother's Day = 2nd Sunday of May */
  nthWeekday?: { month: number; weekday: number; nth: number };
}

// ─── All special dates ───

export const SPECIAL_DATES: SpecialDate[] = [
  // ── Dương lịch cố định ──
  {
    id: "sys_tet_duong",
    name: "Năm Mới Dương Lịch",
    emoji: "🎉",
    icon: "party-popper",
    color: "#F59E0B",
    hint: "Chúc mừng năm mới! Đừng quên lời chúc đến người thân.",
    month: 1,
    day: 1,
  },
  {
    id: "sys_valentine",
    name: "Valentine - Ngày tình nhân",
    emoji: "💝",
    icon: "cards-heart",
    color: "#E91E63",
    hint: "Đừng quên chuẩn bị bất ngờ cho người ấy 💝",
    month: 2,
    day: 14,
  },
  {
    id: "sys_quocte_phunu",
    name: "Ngày Quốc tế Phụ nữ",
    emoji: "🌷",
    icon: "flower-tulip",
    color: "#d9306b",
    hint: "Dành điều đặc biệt cho người phụ nữ của bạn 🌷",
    month: 3,
    day: 8,
  },
  {
    id: "sys_white_day",
    name: "Ngày Valentine Trắng",
    emoji: "🤍",
    icon: "cards-heart-outline",
    color: "#64748B",
    hint: "Đáp lại tình cảm Valentine bằng điều ngọt ngào 🍬",
    month: 3,
    day: 14,
  },
  {
    id: "sys_giai_phong",
    name: "Ngày Giải phóng",
    emoji: "🇻🇳",
    icon: "flag-variant",
    color: "#EF4444",
    hint: "Ngày lễ quốc gia",
    month: 4,
    day: 30,
  },
  {
    id: "sys_lao_dong",
    name: "Ngày Quốc tế Lao động",
    emoji: "🌟",
    icon: "hammer",
    color: "#F97316",
    hint: "Ngày lễ quốc gia",
    month: 5,
    day: 1,
  },
  {
    id: "sys_thieu_nhi",
    name: "Ngày Quốc tế Thiếu nhi",
    emoji: "🎠",
    icon: "baby-face-outline",
    color: "#06B6D4",
    hint: "Ngày đặc biệt dành cho những đứa trẻ yêu thương 🧒",
    month: 6,
    day: 1,
  },
  {
    id: "sys_quoc_khanh",
    name: "Ngày Quốc khánh",
    emoji: "🇻🇳",
    icon: "flag",
    color: "#EF4444",
    hint: "Ngày lễ quốc gia",
    month: 9,
    day: 2,
  },
  {
    id: "sys_phunu_vn",
    name: "Ngày Phụ nữ Việt Nam",
    emoji: "🌸",
    icon: "flower-pollen",
    color: "#EC4899",
    hint: "Bày tỏ yêu thương và biết ơn đến người phụ nữ bạn trân trọng 💐",
    month: 10,
    day: 20,
  },
  {
    id: "sys_nha_giao",
    name: "Ngày Nhà giáo VN",
    emoji: "📚",
    icon: "book-open-page-variant",
    color: "#10B981",
    hint: "Tri ân thầy cô đã dạy dỗ bạn 🙏",
    month: 11,
    day: 20,
  },
  {
    id: "sys_giang_sinh",
    name: "Giáng Sinh",
    emoji: "🎄",
    icon: "pine-tree",
    color: "#16A34A",
    hint: "Mùa lễ hội yêu thương đang đến! Chuẩn bị quà và kế hoạch 🎁",
    month: 12,
    day: 25,
  },

  // ── Ngày theo quy tắc (nth weekday) ──
  {
    id: "sys_ngay_me",
    name: "Ngày của Mẹ",
    emoji: "👩‍👧",
    icon: "heart-multiple",
    color: "#EC4899",
    hint: "Hãy dành những điều tuyệt vời nhất cho mẹ 💕",
    nthWeekday: { month: 5, weekday: 0, nth: 2 }, // Chủ nhật thứ 2, tháng 5
  },
  {
    id: "sys_ngay_cha",
    name: "Ngày của Cha",
    emoji: "👨‍👧",
    icon: "human-male",
    color: "#3B82F6",
    hint: "Cảm ơn cha vì tất cả những gì cha đã làm 💙",
    nthWeekday: { month: 6, weekday: 0, nth: 3 }, // Chủ nhật thứ 3, tháng 6
  },

  // ── Âm lịch ──
  {
    id: "sys_tet_nguyen_dan",
    name: "Tết Nguyên Đán",
    emoji: "🏮",
    icon: "home-heart",
    color: "#DC2626",
    hint: "Năm mới âm lịch — sum họp gia đình 🏮",
    lunarMonth: 1,
    lunarDay: 1,
  },
  {
    id: "sys_ram_thang_gieng",
    name: "Rằm tháng Giêng",
    emoji: "🧧",
    icon: "moon-waning-crescent",
    color: "#F59E0B",
    hint: "Tết Nguyên tiêu — cầu an đầu năm 🙏",
    lunarMonth: 1,
    lunarDay: 15,
  },
  {
    id: "sys_vu_lan",
    name: "Vu Lan - Ngày Báo hiếu",
    emoji: "🌹",
    icon: "flower-outline",
    color: "#E91E63",
    hint: "Tháng 7 âm lịch — bày tỏ lòng hiếu thảo với cha mẹ ❤️",
    lunarMonth: 7,
    lunarDay: 15,
  },
  {
    id: "sys_trung_thu",
    name: "Tết Trung Thu",
    emoji: "🥮",
    icon: "moon-full",
    color: "#F97316",
    hint: "Rằm tháng 8 — phá cỗ trông trăng cùng gia đình 🌕",
    lunarMonth: 8,
    lunarDay: 15,
  },
  {
    id: "sys_ong_tao",
    name: "Ngày ông Công ông Táo",
    emoji: "🐟",
    icon: "fish",
    color: "#EF4444",
    hint: "23 tháng Chạp — tiễn Táo Quân về trời 🎏",
    lunarMonth: 12,
    lunarDay: 23,
  },
];

// ─── Helpers ───

/**
 * Get the nth occurrence of a weekday in a given month/year.
 * weekday: 0=Sunday, 1=Monday, ...
 */
function getNthWeekday(
  year: number,
  month: number,
  weekday: number,
  nth: number
): Date {
  const first = new Date(year, month - 1, 1);
  let firstWeekday = first.getDay();
  let dayOfMonth = 1 + ((weekday - firstWeekday + 7) % 7);
  dayOfMonth += (nth - 1) * 7;
  return new Date(year, month - 1, dayOfMonth);
}

/**
 * Resolve a SpecialDate to a solar Date for a given year.
 * Returns null if the date doesn't exist (e.g. invalid lunar date).
 */
export function resolveSpecialDateForYear(
  sd: SpecialDate,
  year: number
): Date | null {
  if (sd.month && sd.day) {
    return new Date(year, sd.month - 1, sd.day);
  }
  if (sd.nthWeekday) {
    return getNthWeekday(
      year,
      sd.nthWeekday.month,
      sd.nthWeekday.weekday,
      sd.nthWeekday.nth
    );
  }
  if (sd.lunarMonth && sd.lunarDay) {
    return lunarService.lunarToSolarForYear(sd.lunarMonth, sd.lunarDay, year);
  }
  return null;
}

/**
 * Get all special dates resolved to solar dates for a given year+month.
 * Returns array of { ...SpecialDate, solarMonth, solarDay } for dates falling in that month.
 */
export function getSpecialDatesForMonth(
  year: number,
  month: number // 1-12
): (SpecialDate & { solarMonth: number; solarDay: number })[] {
  const results: (SpecialDate & { solarMonth: number; solarDay: number })[] =
    [];

  for (const sd of SPECIAL_DATES) {
    const date = resolveSpecialDateForYear(sd, year);
    if (!date) continue;
    if (date.getFullYear() === year && date.getMonth() + 1 === month) {
      results.push({ ...sd, solarMonth: month, solarDay: date.getDate() });
    }
  }

  return results;
}
