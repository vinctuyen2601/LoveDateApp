/**
 * notification.ios.ts
 * iOS-specific notification logic.
 *
 * Key differences from Android:
 * - No notification channels needed
 * - Supports CALENDAR trigger for truly repeating yearly events
 *   (fires automatically every year without rescheduling)
 * - DATE trigger for one-time events
 * - Permissions: standard requestPermissionsAsync only
 */

import * as Notifications from 'expo-notifications';
import { Event } from '../types';
import {
  createNotificationContent,
  resolveEventDate,
  computeNotificationDate,
} from './notification.shared';

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestIosPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowAnnouncements: true,
    },
  });

  return status === 'granted';
}

// ─── Trigger builder ──────────────────────────────────────────────────────────

/**
 * Build the appropriate iOS trigger:
 * - Recurring yearly → CALENDAR trigger (repeats automatically every year)
 * - Everything else  → DATE trigger (one-shot)
 */
function buildIosTrigger(
  event: Event,
  notificationDate: Date,
  hour: number,
  minute: number
): Notifications.NotificationTriggerInput {
  const patternType = event.recurrencePattern?.type ?? 'yearly';

  if (event.isRecurring && patternType === 'yearly') {
    // CALENDAR trigger repeats every year on the same day/month — iOS only.
    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: true,
      day: notificationDate.getDate(),
      month: notificationDate.getMonth() + 1,
      hour,
      minute,
    };
  }

  // DATE trigger for one-time events and non-yearly recurring (weekly/monthly).
  // weekly/monthly recurring are handled by notificationScheduler.service.ts
  // which schedules multiple occurrences in a window — so DATE trigger is correct here too.
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: notificationDate,
  };
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

/**
 * Schedule a single notification for an event on iOS.
 *
 * Yearly recurring → CALENDAR trigger (auto-repeats, no annual rescheduling needed).
 * One-time / weekly / monthly → DATE trigger.
 *
 * @returns notificationId, or null if the date is in the past and skipped.
 */
export async function scheduleIosNotification(
  event: Event,
  daysBefore: number
): Promise<string | null> {
  try {
    const eventDate = resolveEventDate(event);
    const reminderTime = event.reminderSettings?.reminderTime;
    const hour = reminderTime?.hour ?? 9;
    const minute = reminderTime?.minute ?? 0;

    const notificationDate = computeNotificationDate(eventDate, daysBefore, reminderTime);

    const patternType = event.recurrencePattern?.type ?? 'yearly';
    const isYearlyRecurring = event.isRecurring && patternType === 'yearly';

    // One-time events in the past → skip.
    // Yearly recurring → CALENDAR trigger handles future years automatically.
    // weekly/monthly recurring in the past → skip (window scheduler handles these).
    if (!isYearlyRecurring && notificationDate <= new Date()) {
      return null;
    }

    const content = createNotificationContent(event, daysBefore);
    const trigger = buildIosTrigger(event, notificationDate, hour, minute);

    return await Notifications.scheduleNotificationAsync({ content, trigger });
  } catch (error) {
    console.error('[iOS] Error scheduling notification:', error);
    return null;
  }
}

/**
 * Schedule a notification and return detailed info (for logging).
 */
export async function scheduleIosNotificationWithDetails(
  event: Event,
  daysBefore: number
): Promise<{ notificationId: string | null; scheduledAt: string }> {
  try {
    const eventDate = resolveEventDate(event);
    const reminderTime = event.reminderSettings?.reminderTime;
    const hour = reminderTime?.hour ?? 9;
    const minute = reminderTime?.minute ?? 0;

    const notificationDate = computeNotificationDate(eventDate, daysBefore, reminderTime);

    const patternType = event.recurrencePattern?.type ?? 'yearly';
    const isYearlyRecurring = event.isRecurring && patternType === 'yearly';

    if (!isYearlyRecurring && notificationDate <= new Date()) {
      return { notificationId: null, scheduledAt: notificationDate.toISOString() };
    }

    const content = createNotificationContent(event, daysBefore);
    const trigger = buildIosTrigger(event, notificationDate, hour, minute);

    const notificationId = await Notifications.scheduleNotificationAsync({ content, trigger });

    return { notificationId, scheduledAt: notificationDate.toISOString() };
  } catch (error) {
    console.error('[iOS] Error scheduling notification with details:', error);
    throw error;
  }
}
