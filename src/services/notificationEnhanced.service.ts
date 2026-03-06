import * as Notifications from 'expo-notifications';
import * as SQLite from 'expo-sqlite';
import { Event } from '../types';
import { NotificationUtils } from '@lib/notification.utils';
import * as NotificationLogService from './notificationLog.service';

/**
 * Enhanced Notification Service with logging, retry logic, and reliability improvements
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationEnhancedService {
  private isInitialized = false;
  private db: SQLite.SQLiteDatabase | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private notificationReceivedSubscription: Notifications.Subscription | null = null;
  private notificationResponseSubscription: Notifications.Subscription | null = null;

  /**
   * Initialize notification service with database
   */
  async init(database: SQLite.SQLiteDatabase): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Enhanced notification service already initialized');
      return;
    }

    try {
      this.db = database;

      // Setup notification channels FIRST (Android) — không cần permission để tạo channel
      await NotificationUtils.setupNotificationChannels();

      // Request permissions
      const hasPermission = await NotificationUtils.requestPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Notification permissions not granted — channels đã sẵn sàng khi được cấp quyền');
      }

      // Setup listeners for delivered notifications
      this.setupDeliveryListeners();

      // Mark expired notifications on init
      if (this.db) {
        const expiredCount = await NotificationLogService.markExpiredNotifications(
          this.db
        );
        if (expiredCount > 0) {
          console.log(`📋 Marked ${expiredCount} notifications as expired`);
        }
      }

      this.isInitialized = true;
      console.log('✅ Enhanced notification service initialized');
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      throw error;
    }
  }

  /**
   * Cleanup notification service (remove listeners)
   */
  cleanup(): void {
    if (this.notificationReceivedSubscription) {
      this.notificationReceivedSubscription.remove();
      this.notificationReceivedSubscription = null;
    }
    if (this.notificationResponseSubscription) {
      this.notificationResponseSubscription.remove();
      this.notificationResponseSubscription = null;
    }
    this.isInitialized = false;
    console.log('✅ Enhanced notification service cleaned up');
  }

  /**
   * Setup listeners to track notification delivery
   */
  private setupDeliveryListeners(): void {
    // Remove existing listeners if any
    if (this.notificationReceivedSubscription) {
      this.notificationReceivedSubscription.remove();
    }
    if (this.notificationResponseSubscription) {
      this.notificationResponseSubscription.remove();
    }

    // Listen for notification received (app in foreground)
    this.notificationReceivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      this.handleNotificationDelivered(notification);
    });

    // Listen for notification response (user tapped notification)
    this.notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      this.handleNotificationDelivered(response.notification);
    });
  }

  /**
   * Handle notification delivered
   */
  private async handleNotificationDelivered(
    notification: Notifications.Notification
  ): Promise<void> {
    if (!this.db) return;

    try {
      const notificationId = notification.request.identifier;
      await NotificationLogService.markNotificationDelivered(
        this.db,
        notificationId
      );
      console.log(`✅ Notification delivered: ${notificationId}`);
    } catch (error) {
      console.error('Error marking notification as delivered:', error);
    }
  }

  /**
   * Schedule notification with retry logic and logging
   */
  private async scheduleNotificationWithRetry(
    event: Event,
    daysBefore: number,
    attempt: number = 0
  ): Promise<{
    success: boolean;
    notificationId?: string;
    scheduledAt?: string;
    error?: string;
  }> {
    try {
      const result = await NotificationUtils.scheduleNotificationWithDetails(
        event,
        daysBefore
      );

      if (result.notificationId) {
        return {
          success: true,
          notificationId: result.notificationId,
          scheduledAt: result.scheduledAt,
        };
      } else {
        // null means date is in the past for one-time events — not retryable
        return { success: false, error: 'Notification date is in the past' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Retry logic
      if (attempt < this.maxRetries) {
        console.warn(
          `⚠️ Retry ${attempt + 1}/${this.maxRetries} for notification scheduling`
        );
        await this.delay(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        return this.scheduleNotificationWithRetry(event, daysBefore, attempt + 1);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Schedule notifications for an event with logging
   */
  async scheduleEventNotifications(event: Event): Promise<{
    totalScheduled: number;
    totalFailed: number;
  }> {
    if (!this.db) {
      console.error('❌ Database not initialized');
      return { totalScheduled: 0, totalFailed: 0 };
    }

    // Skip if notification is disabled for this event
    if (event.isNotificationEnabled === false) {
      await NotificationUtils.cancelEventNotifications(event.id);
      return { totalScheduled: 0, totalFailed: 0 };
    }

    try {
      // Cancel existing notifications for this event
      await NotificationUtils.cancelEventNotifications(event.id);

      // Delete old logs for this event
      await NotificationLogService.deleteEventNotificationLogs(this.db, event.id);

      const { remindDaysBefore } = event.reminderSettings;
      let totalScheduled = 0;
      let totalFailed = 0;

      for (const daysBefore of remindDaysBefore) {
        const result = await this.scheduleNotificationWithRetry(event, daysBefore);

        if (result.success && result.notificationId && result.scheduledAt) {
          // Log success
          await NotificationLogService.logNotificationScheduled(
            this.db,
            event.id,
            result.notificationId,
            daysBefore,
            result.scheduledAt
          );
          totalScheduled++;
          console.log(
            `✅ Scheduled notification for "${event.title}" (${daysBefore} days before)`
          );
        } else {
          // Log failure
          await NotificationLogService.logNotificationFailed(
            this.db,
            event.id,
            daysBefore,
            result.scheduledAt || new Date().toISOString(),
            result.error || 'Unknown error'
          );
          totalFailed++;
          console.error(
            `❌ Failed to schedule notification for "${event.title}" (${daysBefore} days before): ${result.error}`
          );
        }
      }

      console.log(
        `📋 Scheduling complete for "${event.title}": ${totalScheduled} success, ${totalFailed} failed`
      );

      return { totalScheduled, totalFailed };
    } catch (error) {
      console.error('Error scheduling event notifications:', error);
      throw error;
    }
  }

  /**
   * Update notifications for an event
   */
  async updateEventNotifications(event: Event): Promise<void> {
    await this.scheduleEventNotifications(event);
  }

  /**
   * Cancel notifications for an event with logging
   */
  async cancelEventNotifications(eventId: string): Promise<void> {
    if (!this.db) return;

    try {
      // Get notification IDs before canceling
      const logs = await NotificationLogService.getEventNotificationLogs(
        this.db,
        eventId
      );

      // Cancel notifications
      await NotificationUtils.cancelEventNotifications(eventId);

      // Mark as cancelled in logs
      for (const log of logs) {
        if (log.notificationId && log.status === 'scheduled') {
          await NotificationLogService.markNotificationCancelled(
            this.db,
            log.notificationId
          );
        }
      }

      console.log(`✅ Cancelled notifications for event: ${eventId}`);
    } catch (error) {
      console.error('Error cancelling event notifications:', error);
      throw error;
    }
  }

  /**
   * Schedule notifications for multiple events
   */
  async scheduleBulkNotifications(events: Event[]): Promise<{
    totalScheduled: number;
    totalFailed: number;
  }> {
    let totalScheduled = 0;
    let totalFailed = 0;

    for (const event of events) {
      const result = await this.scheduleEventNotifications(event);
      totalScheduled += result.totalScheduled;
      totalFailed += result.totalFailed;
    }

    console.log(
      `📋 Bulk scheduling complete: ${totalScheduled} success, ${totalFailed} failed across ${events.length} events`
    );

    return { totalScheduled, totalFailed };
  }

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await NotificationUtils.getAllScheduledNotifications();
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await NotificationUtils.cancelAllNotifications();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      throw error;
    }
  }

  /**
   * Add notification listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Test notification (for debugging)
   */
  async testNotification(event: Event): Promise<void> {
    await NotificationUtils.presentNotificationNow(event, 1);
  }

  /**
   * Reschedule all event notifications (used on app resume)
   */
  async rescheduleAllNotifications(events: Event[]): Promise<void> {
    if (!this.db) return;

    try {
      console.log('🔄 Rescheduling all notifications for', events.length, 'events');

      // Cancel all existing notifications
      await NotificationUtils.cancelAllNotifications();

      // Reschedule for all events
      for (const event of events) {
        if (!event.isDeleted) {
          await this.scheduleEventNotifications(event);
        }
      }

      console.log('✅ All notifications rescheduled');
    } catch (error) {
      console.error('Error rescheduling all notifications:', error);
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    total: number;
    scheduled: number;
    delivered: number;
    failed: number;
    cancelled: number;
    successRate: number;
  }> {
    if (!this.db) {
      return {
        total: 0,
        scheduled: 0,
        delivered: 0,
        failed: 0,
        cancelled: 0,
        successRate: 0,
      };
    }

    return await NotificationLogService.getNotificationStats(this.db);
  }

  /**
   * Get failed notifications for retry
   */
  async getFailedNotifications(): Promise<any[]> {
    if (!this.db) return [];
    return await NotificationLogService.getFailedNotifications(this.db);
  }

  /**
   * Cleanup old logs (keep last 90 days)
   */
  async cleanupOldLogs(): Promise<number> {
    if (!this.db) return 0;
    return await NotificationLogService.cleanupOldLogs(this.db, 90);
  }
}

// Export singleton instance
export const notificationEnhancedService = new NotificationEnhancedService();
