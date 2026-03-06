/**
 * notification.shared.ts
 * Shared helpers used by both iOS and Android notification implementations.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Event, NotificationPriority } from '../types';
import { DateUtils } from './date.utils';
import { STRINGS } from '../constants/strings';
import { lunarService } from '../services/lunar.service';

// ─── Priority mapping ────────────────────────────────────────────────────────

export function getNotificationPriority(daysBefore: number): NotificationPriority {
  if (daysBefore === 0) return 'urgent';
  if (daysBefore <= 3) return 'important';
  return 'reminder';
}

export function getChannelId(priority: NotificationPriority): string {
  return priority; // channel IDs match priority names
}

// ─── Icon ────────────────────────────────────────────────────────────────────

export function getNotificationIcon(tags: string[]): string {
  if (tags.includes('birthday')) return '🎂';
  if (tags.includes('anniversary')) return '❤️';
  if (tags.includes('holiday')) return '🎉';
  if (tags.includes('wife') || tags.includes('husband')) return '💑';
  if (tags.includes('family')) return '👨‍👩‍👧‍👦';
  return '📅';
}

// ─── Content ─────────────────────────────────────────────────────────────────

export function createNotificationContent(
  event: Event,
  daysBefore: number
): Notifications.NotificationContentInput {
  const priority = getNotificationPriority(daysBefore);
  const eventDateDisplay = DateUtils.formatDate(event.eventDate);

  let body = '';
  if (daysBefore === 0) {
    body = `Hôm nay là ${event.title}!`;
  } else if (daysBefore === 1) {
    body = `Còn 1 ngày nữa đến ${event.title} (${eventDateDisplay})`;
  } else {
    body = `Còn ${daysBefore} ngày nữa đến ${event.title} (${eventDateDisplay})`;
  }

  return {
    title: `${getNotificationIcon(event.tags)} ${STRINGS.notif_reminder_title}`,
    body,
    data: {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.eventDate,
      daysBefore,
    },
    sound: 'default',
    priority: priority === 'urgent' ? 'high' : 'default',
    // channelId injected by Android implementation
    ...(Platform.OS === 'android' && {
      channelId: getChannelId(priority),
    }),
  };
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Resolve the base event date, converting from lunar if needed.
 */
export function resolveEventDate(event: Event): Date {
  const base = new Date(event.eventDate);
  if (event.isLunarCalendar) {
    return lunarService.convertEventDate(base, true);
  }
  return base;
}

/**
 * Compute the notification fire date: eventDate - daysBefore, at the configured time.
 */
export function computeNotificationDate(
  eventDate: Date,
  daysBefore: number,
  reminderTime?: { hour: number; minute: number }
): Date {
  const d = new Date(eventDate);
  d.setDate(d.getDate() - daysBefore);
  d.setHours(reminderTime?.hour ?? 9, reminderTime?.minute ?? 0, 0, 0);
  return d;
}

/**
 * For recurring events, advance the date forward using the correct step
 * until it is in the future.
 */
export function advanceToNextOccurrence(date: Date, event: Event): Date {
  const patternType = event.recurrencePattern?.type ?? 'yearly';
  const now = new Date();
  const result = new Date(date);
  let safetyLimit = 0;
  while (result <= now && safetyLimit < 1000) {
    switch (patternType) {
      case 'weekly':  result.setDate(result.getDate() + 7);   break;
      case 'monthly': result.setMonth(result.getMonth() + 1); break;
      default:        result.setFullYear(result.getFullYear() + 1); break;
    }
    safetyLimit++;
  }
  return result;
}

// ─── Cancel helpers ───────────────────────────────────────────────────────────

export async function cancelEventNotifications(eventId: string): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = all.filter(n => n.content.data?.eventId === eventId);
    for (const n of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  } catch (error) {
    console.error('Error canceling event notifications:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

export async function getEventNotifications(eventId: string): Promise<Notifications.NotificationRequest[]> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.filter(n => n.content.data?.eventId === eventId);
  } catch (error) {
    console.error('Error getting event notifications:', error);
    return [];
  }
}
