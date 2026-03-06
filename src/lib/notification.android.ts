/**
 * notification.android.ts
 * Android-specific notification logic.
 *
 * Key differences from iOS:
 * - Requires notification channels (urgent / important / reminder)
 * - Only supports DATE trigger — no CALENDAR trigger
 * - Recurring events: manually advance to next occurrence
 * - Android 12+ (API 31+): may need SCHEDULE_EXACT_ALARM permission
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Event } from '../types';
import {
  createNotificationContent,
  resolveEventDate,
  computeNotificationDate,
  advanceToNextOccurrence,
} from './notification.shared';

// ─── Channels ─────────────────────────────────────────────────────────────────

export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('urgent', {
    name: 'Nhắc nhở khẩn cấp',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B6B',
  });

  await Notifications.setNotificationChannelAsync('important', {
    name: 'Nhắc nhở quan trọng',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4ECDC4',
  });

  await Notifications.setNotificationChannelAsync('reminder', {
    name: 'Nhắc nhở',
    importance: Notifications.AndroidImportance.LOW,
    sound: 'default',
    lightColor: '#FFE66D',
  });
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestAndroidPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  // Android 12+ (API 31): SCHEDULE_EXACT_ALARM
  // expo-notifications handles this internally for Expo managed workflow.
  // For bare workflow, the permission is declared in AndroidManifest.xml.
  // Nothing extra needed here at runtime.

  return true;
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

/**
 * Schedule a single notification for an event on Android.
 *
 * Uses DATE trigger for all events (only trigger type Android supports).
 * For recurring events, advances to the next future occurrence automatically.
 *
 * @returns notificationId, or null if the date is in the past and skipped.
 */
export async function scheduleAndroidNotification(
  event: Event,
  daysBefore: number
): Promise<string | null> {
  try {
    const eventDate = resolveEventDate(event);
    let notificationDate = computeNotificationDate(
      eventDate,
      daysBefore,
      event.reminderSettings?.reminderTime
    );

    if (event.isRecurring) {
      // Advance to next future occurrence for recurring events
      if (notificationDate <= new Date()) {
        notificationDate = advanceToNextOccurrence(notificationDate, event);
      }
    } else {
      // One-time event in the past — skip
      if (notificationDate <= new Date()) {
        return null;
      }
    }

    // Final safety check
    if (notificationDate <= new Date()) return null;

    const content = createNotificationContent(event, daysBefore);

    return await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
      },
    });
  } catch (error) {
    console.error('[Android] Error scheduling notification:', error);
    return null;
  }
}

/**
 * Schedule a notification and return detailed info (for logging).
 */
export async function scheduleAndroidNotificationWithDetails(
  event: Event,
  daysBefore: number
): Promise<{ notificationId: string | null; scheduledAt: string }> {
  try {
    const eventDate = resolveEventDate(event);
    let notificationDate = computeNotificationDate(
      eventDate,
      daysBefore,
      event.reminderSettings?.reminderTime
    );

    if (event.isRecurring) {
      if (notificationDate <= new Date()) {
        notificationDate = advanceToNextOccurrence(notificationDate, event);
      }
    } else {
      if (notificationDate <= new Date()) {
        return { notificationId: null, scheduledAt: notificationDate.toISOString() };
      }
    }

    if (notificationDate <= new Date()) {
      return { notificationId: null, scheduledAt: notificationDate.toISOString() };
    }

    const content = createNotificationContent(event, daysBefore);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
      },
    });

    return { notificationId, scheduledAt: notificationDate.toISOString() };
  } catch (error) {
    console.error('[Android] Error scheduling notification with details:', error);
    throw error;
  }
}
