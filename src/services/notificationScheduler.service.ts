import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Event, getTagEmoji } from "../types";
import { lunarService } from "./lunar.service";
import { SPECIAL_DATES, resolveSpecialDateForYear } from "../constants/specialDates";

// ─── Muted special dates (stored in AsyncStorage) ───
const MUTED_SPECIAL_DATES_KEY = "muted_special_dates";

export async function getMutedSpecialDates(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(MUTED_SPECIAL_DATES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function setMutedSpecialDates(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(MUTED_SPECIAL_DATES_KEY, JSON.stringify(ids));
}

export async function toggleMutedSpecialDate(id: string): Promise<boolean> {
  const muted = await getMutedSpecialDates();
  const index = muted.indexOf(id);
  if (index >= 0) {
    muted.splice(index, 1);
  } else {
    muted.push(id);
  }
  await setMutedSpecialDates(muted);
  return index < 0; // true = now muted, false = now unmuted
}

// Re-export for consumers (e.g. SettingsScreen mute list)
export { SPECIAL_DATES as SYSTEM_SPECIAL_DATES };

/**
 * Priority-based Notification Scheduler
 *
 * Strategy:
 * - Collect TẤT CẢ notifications (user + system) trong 90 ngày tới
 * - Sort theo thời gian gần nhất → ưu tiên cao nhất
 * - Chỉ schedule top 60 (iOS max 64, dư 4 slot margin)
 * - Background task + app resume sẽ tự refill khi notifications cũ fire
 */

// 4 thông báo cố định cho mỗi ngày đặc biệt: 7 ngày, 3 ngày, 1 ngày, và trong ngày lúc 8:00
const SYSTEM_REMIND_DAYS = [7, 3, 1, 0];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

// iOS cho phép tối đa 64 scheduled notifications, giữ margin 4 slot
const MAX_SCHEDULED_NOTIFICATIONS = 60;
// Window cố định 90 ngày — collect hết rồi cắt theo priority
const SCHEDULING_WINDOW_DAYS = 90;

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
 * Tìm tất cả ngày xảy ra của event trong cửa sổ (windowStart, windowEnd].
 *
 * BUG FIX: `yearly` dùng năm của windowStart (năm hiện tại) làm gốc,
 * không dùng năm của base (năm tạo event) để tránh bỏ sót năm hiện tại/tương lai.
 */
function getOccurrencesInWindow(
  event: Event,
  windowStart: Date,
  windowEnd: Date
): Date[] {
  const base = resolveBaseDate(event);
  const patternType =
    event.recurrencePattern?.type ?? (event.isRecurring ? "yearly" : "once");
  const results: Date[] = [];

  const addIfInWindow = (d: Date) => {
    const candidate = new Date(d);
    candidate.setHours(0, 0, 0, 0); // dùng đầu ngày để so sánh theo ngày, không theo giờ
    const todayStart = new Date(windowStart);
    todayStart.setHours(0, 0, 0, 0);
    if (candidate >= todayStart && candidate <= windowEnd) {
      results.push(candidate);
    }
  };

  switch (patternType) {
    case "once": {
      addIfInWindow(base);
      break;
    }

    case "yearly": {
      const currentYear = windowStart.getFullYear();
      if (event.isLunarCalendar) {
        // Lunar yearly: phải convert âm → dương cho TỪNG năm
        // vì cùng ngày âm nhưng mỗi năm rơi vào ngày dương khác nhau
        const { month: lunarMonth, day: lunarDay } =
          lunarService.extractLunarCoordinates(new Date(event.eventDate));
        for (let offset = 0; offset <= 2; offset++) {
          const solarDate = lunarService.lunarToSolarForYear(
            lunarMonth, lunarDay, currentYear + offset
          );
          if (solarDate) addIfInWindow(solarDate);
        }
      } else {
        // Solar yearly: chỉ cần đổi year
        for (let offset = 0; offset <= 2; offset++) {
          const d = new Date(base);
          d.setFullYear(currentYear + offset);
          addIfInWindow(d);
        }
      }
      break;
    }

    case "weekly": {
      const targetDay = event.recurrencePattern?.dayOfWeek ?? base.getDay();
      const cursor = new Date(windowStart);
      cursor.setHours(12, 0, 0, 0);
      while (cursor.getDay() !== targetDay) {
        cursor.setDate(cursor.getDate() + 1);
      }
      while (cursor <= windowEnd) {
        results.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 7);
      }
      break;
    }

    case "monthly": {
      const targetDayOfMonth =
        event.recurrencePattern?.dayOfMonth ?? base.getDate();
      const cursor = new Date(windowStart);
      cursor.setDate(1);
      cursor.setHours(12, 0, 0, 0);
      while (cursor <= windowEnd) {
        const daysInMonth = new Date(
          cursor.getFullYear(),
          cursor.getMonth() + 1,
          0
        ).getDate();
        const day = Math.min(targetDayOfMonth, daysInMonth);
        addIfInWindow(
          new Date(cursor.getFullYear(), cursor.getMonth(), day, 12, 0, 0, 0)
        );
        cursor.setMonth(cursor.getMonth() + 1);
      }
      break;
    }
  }

  return results;
}

function getIcon(tags: string[]): string {
  const primaryTag = tags[0];
  if (primaryTag) return getTagEmoji(primaryTag);
  return "📅";
}

function getChannelId(daysBefore: number): string {
  if (daysBefore === 0) return "urgent";
  if (daysBefore <= 3) return "important";
  return "reminder";
}

function buildUserEventBody(title: string, daysBefore: number): string {
  if (daysBefore === 0) return `Hôm nay là ${title}!`;
  if (daysBefore === 1) return `Còn 1 ngày nữa đến ${title}`;
  return `Còn ${daysBefore} ngày nữa đến ${title}`;
}

function buildSystemBody(
  title: string,
  daysBefore: number,
  hint: string
): string {
  if (daysBefore === 0) return `Hôm nay là ${title}! ${hint}`;
  if (daysBefore === 1) return `Ngày mai là ${title}! ${hint}`;
  return `Còn ${daysBefore} ngày nữa đến ${title}. ${hint}`;
}

// ─────────────────────────────────────────────
// PENDING NOTIFICATION — collect trước, schedule sau
// ─────────────────────────────────────────────

interface PendingNotification {
  date: Date;
  content: Notifications.NotificationContentInput;
  source: "user" | "system";
}

/**
 * Collect tất cả system special date notifications trong window
 */
async function collectSystemNotifications(
  now: Date,
  windowEnd: Date
): Promise<PendingNotification[]> {
  const pending: PendingNotification[] = [];
  const currentYear = now.getFullYear();
  const mutedIds = await getMutedSpecialDates();

  for (const sd of SPECIAL_DATES) {
    if (mutedIds.includes(sd.id)) continue;

    for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
      const occurrenceDate = resolveSpecialDateForYear(sd, currentYear + yearOffset);
      if (!occurrenceDate) continue;
      occurrenceDate.setHours(12, 0, 0, 0);
      if (occurrenceDate <= now || occurrenceDate > windowEnd) continue;

      for (const daysBefore of SYSTEM_REMIND_DAYS) {
        const notifDate = new Date(occurrenceDate);
        notifDate.setDate(notifDate.getDate() - daysBefore);
        notifDate.setHours(8, 0, 0, 0);

        if (notifDate <= now) continue;

        pending.push({
          date: notifDate,
          source: "system",
          content: {
            title: `${sd.emoji} Ngày đặc biệt`,
            body: buildSystemBody(sd.name, daysBefore, sd.hint),
            data: { systemDateId: sd.id, eventTitle: sd.name, daysBefore },
            sound: "default",
            priority: daysBefore === 0 ? "high" : "default",
            ...(Platform.OS === "android" && { channelId: getChannelId(daysBefore) }),
          },
        });
      }
    }
  }

  return pending;
}

/**
 * Collect tất cả user event notifications trong window
 */
function collectUserNotifications(
  events: Event[],
  now: Date,
  windowEnd: Date
): PendingNotification[] {
  const pending: PendingNotification[] = [];

  for (const event of events) {
    if (!event.reminderSettings?.remindDaysBefore?.length) continue;

    const occurrences = getOccurrencesInWindow(event, now, windowEnd);
    const reminderTime = event.reminderSettings?.reminderTime ?? { hour: 9, minute: 0 };

    for (const occurrenceDate of occurrences) {
      for (const daysBefore of event.reminderSettings.remindDaysBefore) {
        const notifDate = new Date(occurrenceDate);
        notifDate.setDate(notifDate.getDate() - daysBefore);
        notifDate.setHours(reminderTime.hour, reminderTime.minute, 0, 0);

        if (notifDate <= now) continue;

        pending.push({
          date: notifDate,
          source: "user",
          content: {
            title: `${getIcon(event.tags)} Nhắc nhở`,
            body: buildUserEventBody(event.title, daysBefore),
            data: { eventId: event.id, eventTitle: event.title, daysBefore },
            sound: "default",
            priority: daysBefore === 0 ? "high" : "default",
            ...(Platform.OS === "android" && { channelId: getChannelId(daysBefore) }),
          },
        });
      }
    }
  }

  return pending;
}

// ─────────────────────────────────────────────
// MAIN SCHEDULER
// ─────────────────────────────────────────────

/**
 * Priority-based notification scheduler:
 * 1. Collect TẤT CẢ notifications (user + system) trong 90 ngày tới
 * 2. Sort theo thời gian gần nhất
 * 3. Chỉ schedule top 60 (iOS max 64, dư 4 slot margin)
 *
 * Gọi khi:
 * - App khởi động
 * - App resume từ background
 * - Sau addEvent / updateEvent / deleteEvent
 */
export async function scheduleUpcomingNotifications(
  events: Event[]
): Promise<{ scheduled: number; systemScheduled: number; windowDays: number }> {
  const activeEvents = events.filter((e) => !e.isDeleted);

  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + SCHEDULING_WINDOW_DAYS);

  // Hủy tất cả notifications hiện có
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Collect tất cả notifications trong window
  const userPending = collectUserNotifications(activeEvents, now, windowEnd);
  const systemPending = await collectSystemNotifications(now, windowEnd);
  const allPending = [...userPending, ...systemPending];

  // Sort theo thời gian gần nhất → ưu tiên cao nhất
  allPending.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Cắt theo limit iOS
  const toSchedule = allPending.slice(0, MAX_SCHEDULED_NOTIFICATIONS);

  // Schedule
  let userScheduled = 0;
  let systemScheduled = 0;

  for (const item of toSchedule) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: item.content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.date,
        },
      });
      if (item.source === "user") userScheduled++;
      else systemScheduled++;
    } catch (err) {
      console.error(
        `Failed to schedule notification "${item.content.title}" at ${item.date}:`,
        err
      );
    }
  }

  const dropped = allPending.length - toSchedule.length;
  console.log(
    `📅 Scheduled ${userScheduled} user + ${systemScheduled} system notifications` +
      ` | total candidates: ${allPending.length}` +
      (dropped > 0 ? ` | ⚠️ dropped ${dropped} (over ${MAX_SCHEDULED_NOTIFICATIONS} limit)` : "") +
      ` | window: ${SCHEDULING_WINDOW_DAYS} days | events: ${activeEvents.length}`
  );

  return { scheduled: userScheduled, systemScheduled, windowDays: SCHEDULING_WINDOW_DAYS };
}
