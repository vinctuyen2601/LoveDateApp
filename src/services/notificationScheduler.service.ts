import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Event } from '../types';
import { lunarService } from './lunar.service';

/**
 * Smart Notification Scheduler
 *
 * Strategy:
 * - Dùng DATE trigger (one-shot) thay vì CALENDAR trigger (permanent)
 * - Chỉ schedule cho cửa sổ thời gian tới, window size tùy số lượng event
 * - Gọi mỗi lần: app start, app resume, sau mỗi thao tác CRUD event
 *
 * Budget iOS (max 64 notifications):
 *   System special dates: tối đa 2-3 ngày/window × 4 reminders = ~8-12 slots
 *   User events: ~52 slots còn lại
 *   Worst case 30-day window: 8 events × 6 options = 48 + 12 system = 60 ✅
 *
 * Window logic (user events):
 *   ≤ 5  events → 60 ngày
 *   ≤ 10 events → 30 ngày
 *   ≤ 20 events → 15 ngày
 *   > 20 events →  7 ngày
 */

// ─────────────────────────────────────────────
// SYSTEM SPECIAL DATES
// Tự động nhắc người dùng về các ngày đặc biệt trong năm.
// Không cần tạo event thủ công — luôn được schedule song song với user events.
// ─────────────────────────────────────────────

interface SystemSpecialDate {
  id: string;
  title: string;
  month: number; // 1-12
  day: number;   // 1-31
  remindDaysBefore: number[];
  icon: string;
  hint: string; // Phần cuối của body notification
}

// 4 thông báo cố định cho mỗi ngày đặc biệt: 7 ngày, 3 ngày, 1 ngày, và trong ngày lúc 8:00
const SYSTEM_REMIND_DAYS = [7, 3, 1, 0];

const SYSTEM_SPECIAL_DATES: SystemSpecialDate[] = [
  {
    id: 'sys_tet_duong',
    title: 'Năm mới dương lịch',
    month: 1, day: 1,
    remindDaysBefore: SYSTEM_REMIND_DAYS,
    icon: '🎆',
    hint: 'Chúc mừng năm mới! Đừng quên lời chúc đến người thân.',
  },
  {
    id: 'sys_valentine',
    title: 'Valentine - Ngày tình nhân',
    month: 2, day: 14,
    remindDaysBefore: SYSTEM_REMIND_DAYS,
    icon: '❤️',
    hint: 'Đừng quên chuẩn bị bất ngờ cho người ấy 💝',
  },
  {
    id: 'sys_quocte_phunu',
    title: 'Ngày Quốc tế Phụ nữ 8/3',
    month: 3, day: 8,
    remindDaysBefore: SYSTEM_REMIND_DAYS,
    icon: '🌸',
    hint: 'Dành điều đặc biệt cho người phụ nữ của bạn 🌷',
  },
  {
    id: 'sys_white_day',
    title: 'White Day 14/3',
    month: 3, day: 14,
    remindDaysBefore: SYSTEM_REMIND_DAYS,
    icon: '🤍',
    hint: 'Đáp lại tình cảm Valentine bằng điều ngọt ngào 🍬',
  },
  {
    id: 'sys_thieu_nhi',
    title: 'Ngày Quốc tế Thiếu nhi 1/6',
    month: 6, day: 1,
    remindDaysBefore: SYSTEM_REMIND_DAYS,
    icon: '🎠',
    hint: 'Ngày đặc biệt dành cho những đứa trẻ yêu thương 🧒',
  },
  {
    id: 'sys_phunu_vn',
    title: 'Ngày Phụ nữ Việt Nam 20/10',
    month: 10, day: 20,
    remindDaysBefore: SYSTEM_REMIND_DAYS,
    icon: '🌺',
    hint: 'Bày tỏ yêu thương và biết ơn đến người phụ nữ bạn trân trọng 💐',
  },
  {
    id: 'sys_nha_giao',
    title: 'Ngày Nhà giáo Việt Nam 20/11',
    month: 11, day: 20,
    remindDaysBefore: SYSTEM_REMIND_DAYS,
    icon: '📚',
    hint: 'Tri ân thầy cô đã dạy dỗ bạn 🙏',
  },
  {
    id: 'sys_giang_sinh',
    title: 'Giáng sinh 25/12',
    month: 12, day: 25,
    remindDaysBefore: SYSTEM_REMIND_DAYS,
    icon: '🎄',
    hint: 'Mùa lễ hội yêu thương đang đến! Chuẩn bị quà và kế hoạch 🎁',
  },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

export function getSchedulingWindowDays(eventCount: number): number {
  if (eventCount <= 5) return 60;
  if (eventCount <= 10) return 30;
  if (eventCount <= 20) return 15;
  return 7;
}

function resolveBaseDate(event: Event): Date {
  const date = new Date(event.eventDate);
  if (event.isLunarCalendar) {
    return lunarService.convertEventDate(date, true);
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
    event.recurrencePattern?.type ?? (event.isRecurring ? 'yearly' : 'once');
  const results: Date[] = [];

  const addIfInWindow = (d: Date) => {
    const candidate = new Date(d);
    candidate.setHours(12, 0, 0, 0);
    if (candidate > windowStart && candidate <= windowEnd) {
      results.push(candidate);
    }
  };

  switch (patternType) {
    case 'once': {
      addIfInWindow(base);
      break;
    }

    case 'yearly': {
      // Dùng năm hiện tại làm gốc — đúng dù event được tạo từ năm nào
      const currentYear = windowStart.getFullYear();
      for (let offset = 0; offset <= 2; offset++) {
        const d = new Date(base);
        d.setFullYear(currentYear + offset);
        addIfInWindow(d);
      }
      break;
    }

    case 'weekly': {
      const targetDay =
        event.recurrencePattern?.dayOfWeek ?? base.getDay();
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

    case 'monthly': {
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
  if (tags.includes('birthday')) return '🎂';
  if (tags.includes('anniversary')) return '❤️';
  if (tags.includes('holiday')) return '🎉';
  if (tags.includes('wife') || tags.includes('husband')) return '💑';
  if (tags.includes('family')) return '👨‍👩‍👧‍👦';
  return '📅';
}

function getChannelId(daysBefore: number): string {
  if (daysBefore === 0) return 'urgent';
  if (daysBefore <= 3) return 'important';
  return 'reminder';
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
// SYSTEM SPECIAL DATES SCHEDULER
// ─────────────────────────────────────────────

async function scheduleSystemSpecialDates(
  now: Date,
  windowEnd: Date
): Promise<number> {
  let scheduled = 0;
  const currentYear = now.getFullYear();

  for (const sd of SYSTEM_SPECIAL_DATES) {
    // Tìm occurrence của ngày đặc biệt trong window (năm hiện tại và tiếp theo)
    for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
      const occurrenceDate = new Date(
        currentYear + yearOffset,
        sd.month - 1,
        sd.day,
        12,
        0,
        0,
        0
      );

      // Bỏ qua nếu occurrence nằm ngoài window
      if (occurrenceDate <= now || occurrenceDate > windowEnd) continue;

      for (const daysBefore of sd.remindDaysBefore) {
        const notifDate = new Date(occurrenceDate);
        notifDate.setDate(notifDate.getDate() - daysBefore);
        notifDate.setHours(8, 0, 0, 0); // System dates nhắc lúc 8:00 sáng

        if (notifDate <= now) continue;
        if (notifDate > windowEnd) continue;

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${sd.icon} Ngày đặc biệt`,
              body: buildSystemBody(sd.title, daysBefore, sd.hint),
              data: {
                systemDateId: sd.id,
                eventTitle: sd.title,
                daysBefore,
              },
              sound: 'default',
              priority: daysBefore === 0 ? 'high' : 'default',
              ...(Platform.OS === 'android' && {
                channelId: getChannelId(daysBefore),
              }),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: notifDate,
            },
          });
          scheduled++;
        } catch (err) {
          console.error(
            `Failed to schedule system notification for "${sd.title}" (${daysBefore}d before):`,
            err
          );
        }
      }
    }
  }

  return scheduled;
}

// ─────────────────────────────────────────────
// MAIN SCHEDULER
// ─────────────────────────────────────────────

/**
 * Hủy tất cả notifications cũ và schedule lại:
 * 1. User events — trong window tùy số lượng event
 * 2. System special dates — tự động, không cần tạo event
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
  const windowDays = getSchedulingWindowDays(activeEvents.length);

  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + windowDays);

  // Hủy tất cả notifications hiện có
  await Notifications.cancelAllScheduledNotificationsAsync();

  let userScheduled = 0;

  // Schedule user events
  for (const event of activeEvents) {
    const occurrences = getOccurrencesInWindow(event, now, windowEnd);
    const reminderTime = event.reminderSettings?.reminderTime ?? {
      hour: 9,
      minute: 0,
    };

    for (const occurrenceDate of occurrences) {
      for (const daysBefore of event.reminderSettings.remindDaysBefore) {
        const notifDate = new Date(occurrenceDate);
        notifDate.setDate(notifDate.getDate() - daysBefore);
        notifDate.setHours(reminderTime.hour, reminderTime.minute, 0, 0);

        if (notifDate <= now) continue;
        if (notifDate > windowEnd) continue;

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${getIcon(event.tags)} Nhắc nhở`,
              body: buildUserEventBody(event.title, daysBefore),
              data: {
                eventId: event.id,
                eventTitle: event.title,
                daysBefore,
              },
              sound: 'default',
              priority: daysBefore === 0 ? 'high' : 'default',
              ...(Platform.OS === 'android' && {
                channelId: getChannelId(daysBefore),
              }),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: notifDate,
            },
          });
          userScheduled++;
        } catch (err) {
          console.error(
            `Failed to schedule notification for "${event.title}" (${daysBefore}d before):`,
            err
          );
        }
      }
    }
  }

  // Schedule system special dates
  const systemScheduled = await scheduleSystemSpecialDates(now, windowEnd);

  console.log(
    `📅 Scheduled ${userScheduled} user + ${systemScheduled} system notifications` +
    ` | window: ${windowDays} days | events: ${activeEvents.length}`
  );

  return { scheduled: userScheduled, systemScheduled, windowDays };
}
