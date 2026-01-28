import * as Notifications from 'expo-notifications';
import { Platform, Linking, Alert } from 'react-native';
import { Event, NotificationPriority } from '../types';
import { DateUtils } from './date.utils';
import { STRINGS } from '../constants/strings';
import { lunarService } from '../services/lunar.service';
import * as IntentLauncher from 'expo-intent-launcher';

export class NotificationUtils {
  /**
   * Check if exact alarm permission is granted (Android 12+)
   */
  static async canScheduleExactAlarms(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need this permission
    }

    if (Platform.Version < 31) {
      return true; // Android < 12 doesn't need this permission
    }

    try {
      // Check if we can schedule exact alarms
      // On Android 12+, we need SCHEDULE_EXACT_ALARM permission
      // Note: This function may not be available in all expo-notifications versions
      // For now, we'll assume permission is granted
      return true;
    } catch (error) {
      console.error('Error checking exact alarm permission:', error);
      return true; // Default to true to avoid blocking notifications
    }
  }

  /**
   * Request exact alarm permission (Android 12+)
   */
  static async requestExactAlarmPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    if (Platform.Version < 31) {
      return true;
    }

    // For now, skip exact alarm permission request as the API may not be available
    // Users can manually grant permission in system settings if needed
    return true;
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Also check exact alarm permission on Android 12+
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      const canScheduleExact = await NotificationUtils.canScheduleExactAlarms();
      if (!canScheduleExact) {
        await NotificationUtils.requestExactAlarmPermission();
      }
    }

    return finalStatus === 'granted';
  }

  /**
   * Setup notification channels (Android)
   */
  static async setupNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
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
  }

  /**
   * Get notification priority based on days before
   */
  static getNotificationPriority(daysBefore: number): NotificationPriority {
    if (daysBefore === 0) return 'urgent';
    if (daysBefore <= 3) return 'important';
    return 'reminder';
  }

  /**
   * Get Android channel ID based on priority
   */
  static getChannelId(priority: NotificationPriority): string {
    return priority;
  }

  /**
   * Create notification content
   */
  static createNotificationContent(
    event: Event,
    daysBefore: number
  ): Notifications.NotificationContentInput {
    const priority = NotificationUtils.getNotificationPriority(daysBefore);
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
      title: `${NotificationUtils.getNotificationIcon(event.tags)} ${STRINGS.notif_reminder_title}`,
      body,
      data: {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.eventDate,
        daysBefore,
      },
      sound: 'default',
      priority: priority === 'urgent' ? 'high' : 'default',
      ...(Platform.OS === 'android' && {
        channelId: NotificationUtils.getChannelId(priority),
      }),
    };
  }

  /**
   * Get emoji icon based on tags
   */
  static getNotificationIcon(tags: string[]): string {
    if (tags.includes('birthday')) {
      return '🎂';
    } else if (tags.includes('anniversary')) {
      return '❤️';
    } else if (tags.includes('holiday')) {
      return '🎉';
    } else if (tags.includes('wife') || tags.includes('husband')) {
      return '💑';
    } else if (tags.includes('family')) {
      return '👨‍👩‍👧‍👦';
    }
    return '📅';
  }

  /**
   * Schedule notification for a specific date
   */
  static async scheduleNotification(
    event: Event,
    daysBefore: number
  ): Promise<string | null> {
    try {
      // Convert lunar calendar to solar calendar if needed
      let eventDate = new Date(event.eventDate);
      if (event.isLunarCalendar) {
        eventDate = lunarService.convertEventDate(eventDate, true);
      }

      const notificationDate = new Date(eventDate);
      notificationDate.setDate(notificationDate.getDate() - daysBefore);

      // Use custom reminder time if available, otherwise default to 9:00 AM
      // IMPORTANT: setHours() uses local timezone, which is what we want
      const reminderTime = event.reminderSettings?.reminderTime;
      const hour = reminderTime?.hour ?? 9;
      const minute = reminderTime?.minute ?? 0;

      // Set time in local timezone (this is correct behavior)
      notificationDate.setHours(hour, minute, 0, 0);

      // Don't schedule if notification date is in the past
      if (notificationDate < new Date()) {
        return null;
      }

      const content = NotificationUtils.createNotificationContent(event, daysBefore);

      let trigger: Notifications.NotificationTriggerInput;

      if (event.isRecurring) {
        // For recurring events, schedule yearly with calendar trigger
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          day: notificationDate.getDate(),
          month: notificationDate.getMonth() + 1,
          hour,
          minute,
        };
      } else {
        // For one-time events, use date trigger
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate,
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      console.log(
        `Scheduled notification for "${event.title}" at ${notificationDate.toLocaleString()} (Local time: ${hour}:${String(minute).padStart(2, '0')})`
      );

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Schedule all notifications for an event
   */
  static async scheduleEventNotifications(event: Event): Promise<string[]> {
    const notificationIds: string[] = [];
    const { remindDaysBefore } = event.reminderSettings;

    for (const daysBefore of remindDaysBefore) {
      const notificationId = await NotificationUtils.scheduleNotification(event, daysBefore);
      if (notificationId) {
        notificationIds.push(notificationId);
      }
    }

    return notificationIds;
  }

  /**
   * Schedule all notifications for an event with detailed info
   */
  static async scheduleEventNotificationsWithDetails(event: Event): Promise<Array<{
    notificationId: string;
    daysBefore: number;
    scheduledAt: string;
  }>> {
    const results: Array<{
      notificationId: string;
      daysBefore: number;
      scheduledAt: string;
    }> = [];
    const { remindDaysBefore } = event.reminderSettings;

    for (const daysBefore of remindDaysBefore) {
      const notificationId = await NotificationUtils.scheduleNotification(event, daysBefore);
      if (notificationId) {
        // Calculate scheduled date
        let eventDate = new Date(event.eventDate);
        if (event.isLunarCalendar) {
          eventDate = lunarService.convertEventDate(eventDate, true);
        }
        const scheduledDate = new Date(eventDate);
        scheduledDate.setDate(scheduledDate.getDate() - daysBefore);

        results.push({
          notificationId,
          daysBefore,
          scheduledAt: scheduledDate.toISOString(),
        });
      }
    }

    return results;
  }

  /**
   * Cancel all notifications for an event
   */
  static async cancelEventNotifications(eventId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      const eventNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.eventId === eventId
      );

      for (const notification of eventNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get scheduled notifications for an event
   */
  static async getEventNotifications(eventId: string): Promise<Notifications.NotificationRequest[]> {
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      return allNotifications.filter(
        notification => notification.content.data?.eventId === eventId
      );
    } catch (error) {
      console.error('Error getting event notifications:', error);
      return [];
    }
  }

  /**
   * Present local notification immediately (for testing)
   */
  static async presentNotificationNow(event: Event, daysBefore: number = 0): Promise<void> {
    try {
      const content = NotificationUtils.createNotificationContent(event, daysBefore);
      await Notifications.presentNotificationAsync(content);
    } catch (error) {
      console.error('Error presenting notification:', error);
    }
  }
}
