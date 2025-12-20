import * as Notifications from 'expo-notifications';
import { Event } from '../types';
import { NotificationUtils } from '../utils/notification.utils';
import { databaseService } from './database.service';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private isInitialized = false;

  /**
   * Initialize notification service
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const hasPermission = await NotificationUtils.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return;
      }

      // Setup notification channels (Android)
      await NotificationUtils.setupNotificationChannels();

      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
      throw error;
    }
  }

  /**
   * Schedule notifications for an event
   */
  async scheduleEventNotifications(event: Event): Promise<void> {
    try {
      // Cancel existing notifications for this event
      await NotificationUtils.cancelEventNotifications(event.id);

      // Delete old notification records from database
      await databaseService.deleteScheduledNotifications(event.id);

      // Schedule new notifications
      const notificationResults = await NotificationUtils.scheduleEventNotificationsWithDetails(event);

      // Save notification IDs to database
      for (const { notificationId, daysBefore, scheduledAt } of notificationResults) {
        await databaseService.saveScheduledNotification(
          event.id,
          notificationId,
          daysBefore,
          scheduledAt
        );
      }

      console.log(
        `Scheduled ${notificationResults.length} notifications for event: ${event.title}`
      );
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
   * Cancel notifications for an event
   */
  async cancelEventNotifications(eventId: string): Promise<void> {
    try {
      await NotificationUtils.cancelEventNotifications(eventId);
      await databaseService.deleteScheduledNotifications(eventId);
      console.log(`Cancelled notifications for event: ${eventId}`);
    } catch (error) {
      console.error('Error cancelling event notifications:', error);
      throw error;
    }
  }

  /**
   * Schedule notifications for multiple events
   */
  async scheduleBulkNotifications(events: Event[]): Promise<void> {
    try {
      for (const event of events) {
        await this.scheduleEventNotifications(event);
      }
      console.log(`Scheduled notifications for ${events.length} events`);
    } catch (error) {
      console.error('Error scheduling bulk notifications:', error);
      throw error;
    }
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
      await databaseService.clearAllScheduledNotifications();
      console.log('All notifications cancelled');
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
    try {
      console.log('Reschedule all notifications for', events.length, 'events');

      // Cancel all existing notifications
      await NotificationUtils.cancelAllNotifications();

      // Reschedule for all events
      for (const event of events) {
        if (!event.isDeleted) {
          await this.scheduleEventNotifications(event);
        }
      }

      console.log('All notifications rescheduled');
    } catch (error) {
      console.error('Error rescheduling all notifications:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
