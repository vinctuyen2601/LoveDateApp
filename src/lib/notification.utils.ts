/**
 * notification.utils.ts
 * Unified public API — dispatches to the correct platform implementation.
 *
 * Platform split:
 *   iOS     → notification.ios.ts     (CALENDAR trigger for yearly recurring)
 *   Android → notification.android.ts (DATE trigger only, manual advance for recurring)
 *
 * Shared helpers (content, icon, cancel, …) → notification.shared.ts
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Event } from '../types';

// ─── Re-export shared named helpers (for direct imports) ─────────────────────
export {
  getNotificationPriority,
  getChannelId,
  createNotificationContent,
} from './notification.shared';

// Shared helpers — imported for use as static methods below
import {
  createNotificationContent as _createContent,
  cancelEventNotifications as _cancelEvent,
  cancelAllNotifications as _cancelAll,
  getAllScheduledNotifications as _getAll,
  getEventNotifications as _getForEvent,
} from './notification.shared';

// ─── Platform implementations ─────────────────────────────────────────────────
import {
  setupAndroidChannels,
  requestAndroidPermissions,
  scheduleAndroidNotification,
  scheduleAndroidNotificationWithDetails,
} from './notification.android';

import {
  requestIosPermissions,
  scheduleIosNotification,
  scheduleIosNotificationWithDetails,
} from './notification.ios';

// ─── Public API ───────────────────────────────────────────────────────────────

export class NotificationUtils {
  // ── Setup ────────────────────────────────────────────────────────────────────

  /** Create Android notification channels. No-op on iOS. */
  static async setupNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      await setupAndroidChannels();
    }
    // iOS: no channels needed
  }

  /** Request push notification permissions for the current platform. */
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      return requestAndroidPermissions();
    }
    return requestIosPermissions();
  }

  // ── Scheduling ────────────────────────────────────────────────────────────────

  /**
   * Schedule a notification for a single event/daysBefore combination.
   * Returns the notification ID, or null if the date is in the past (skipped).
   */
  static async scheduleNotification(
    event: Event,
    daysBefore: number
  ): Promise<string | null> {
    if (Platform.OS === 'android') {
      return scheduleAndroidNotification(event, daysBefore);
    }
    return scheduleIosNotification(event, daysBefore);
  }

  /**
   * Schedule a notification and return detailed info for logging.
   */
  static async scheduleNotificationWithDetails(
    event: Event,
    daysBefore: number
  ): Promise<{ notificationId: string | null; scheduledAt: string }> {
    if (Platform.OS === 'android') {
      return scheduleAndroidNotificationWithDetails(event, daysBefore);
    }
    return scheduleIosNotificationWithDetails(event, daysBefore);
  }

  /**
   * Schedule all reminders for an event (one per daysBefore value).
   * Returns the list of notification IDs that were successfully scheduled.
   */
  static async scheduleEventNotifications(event: Event): Promise<string[]> {
    const ids: string[] = [];
    for (const daysBefore of event.reminderSettings.remindDaysBefore) {
      const id = await NotificationUtils.scheduleNotification(event, daysBefore);
      if (id) ids.push(id);
    }
    return ids;
  }

  /**
   * Schedule all reminders for an event with detailed logging info.
   */
  static async scheduleEventNotificationsWithDetails(event: Event): Promise<Array<{
    notificationId: string;
    daysBefore: number;
    scheduledAt: string;
  }>> {
    const results: Array<{ notificationId: string; daysBefore: number; scheduledAt: string }> = [];
    for (const daysBefore of event.reminderSettings.remindDaysBefore) {
      const { notificationId, scheduledAt } =
        await NotificationUtils.scheduleNotificationWithDetails(event, daysBefore);
      if (notificationId) {
        results.push({ notificationId, daysBefore, scheduledAt });
      }
    }
    return results;
  }

  /** Present a local notification immediately (for testing). */
  static async presentNotificationNow(event: Event, daysBefore: number = 0): Promise<void> {
    try {
      const content = _createContent(event, daysBefore);
      await Notifications.scheduleNotificationAsync({ content, trigger: null });
    } catch (error) {
      console.error('Error presenting notification:', error);
    }
  }

  // ── Cancel / query ────────────────────────────────────────────────────────────

  static async cancelEventNotifications(eventId: string): Promise<void> {
    return _cancelEvent(eventId);
  }

  static async cancelAllNotifications(): Promise<void> {
    return _cancelAll();
  }

  static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return _getAll();
  }

  static async getEventNotifications(eventId: string): Promise<Notifications.NotificationRequest[]> {
    return _getForEvent(eventId);
  }

  // ── Backwards compatibility ───────────────────────────────────────────────────

  static async canScheduleExactAlarms(): Promise<boolean> {
    return true;
  }

  static async requestExactAlarmPermission(): Promise<boolean> {
    return true;
  }
}
