import AsyncStorage from "@react-native-async-storage/async-storage";
import { addDays } from "date-fns";
import { SPECIAL_DATES, resolveSpecialDateForYear } from "@constants/specialDates";
import { HOLIDAY_SUGGESTIONS, HolidaySuggestion } from "@constants/holidaySuggestions";

const KEY_DONE = (id: string) => `holiday_suggestion_done_${id}`;
const KEY_SNOOZE = (id: string) => `holiday_suggestion_snooze_${id}`;
const SNOOZE_DAYS = 3;

export async function markSuggestionDone(id: string): Promise<void> {
  await AsyncStorage.setItem(KEY_DONE(id), "true");
}

export async function snoozeSuggestion(id: string): Promise<void> {
  await AsyncStorage.setItem(KEY_SNOOZE(id), new Date().toISOString());
}

async function isSnoozed(id: string): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEY_SNOOZE(id));
  if (!val) return false;
  const snoozeDate = new Date(val);
  const expiry = addDays(snoozeDate, SNOOZE_DAYS);
  return new Date() < expiry;
}

async function isDone(id: string): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEY_DONE(id));
  return val === "true";
}

/**
 * Trả về suggestion đầu tiên phù hợp với ngày hiện tại.
 * Điều kiện: ngày lễ sắp đến trong daysBeforeToShow ngày, chưa done, chưa snooze.
 */
export async function getActiveSuggestion(): Promise<HolidaySuggestion | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();

  for (const suggestion of HOLIDAY_SUGGESTIONS) {
    // Kiểm tra done / snooze trước để tránh tính ngày không cần thiết
    const [done, snoozed] = await Promise.all([
      isDone(suggestion.id),
      isSnoozed(suggestion.id),
    ]);
    if (done || snoozed) continue;

    // Tìm special date tương ứng
    const specialDate = SPECIAL_DATES.find((sd) => sd.id === suggestion.holidayId);
    if (!specialDate) continue;

    // Resolve ngày lễ năm nay (và năm sau nếu đã qua)
    let holidayDate = resolveSpecialDateForYear(specialDate, year);
    if (!holidayDate) continue;

    holidayDate.setHours(0, 0, 0, 0);

    // Nếu ngày lễ đã qua năm nay → thử năm sau
    if (holidayDate < today) {
      const nextYear = resolveSpecialDateForYear(specialDate, year + 1);
      if (!nextYear) continue;
      nextYear.setHours(0, 0, 0, 0);
      holidayDate = nextYear;
    }

    // Kiểm tra trong window daysBeforeToShow
    const windowEnd = addDays(today, suggestion.daysBeforeToShow);
    if (holidayDate <= windowEnd) {
      return suggestion;
    }
  }

  return null;
}
