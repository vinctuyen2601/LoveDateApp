import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { databaseService } from './database.service';
import { notificationService } from './notification.service';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

/**
 * Background task to reschedule notifications
 * This runs periodically even when the app is closed
 */
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log('[Background Task] Running notification reschedule task');

    // Get all events from database
    const events = await databaseService.getAllEvents();

    // Reschedule notifications for all events
    await notificationService.rescheduleAllNotifications(events);

    console.log('[Background Task] Successfully rescheduled notifications');

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background Task] Error rescheduling notifications:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundTaskService {
  /**
   * Register background fetch task
   */
  async registerBackgroundTask(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_NOTIFICATION_TASK
      );

      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
          minimumInterval: 60 * 60 * 12, // 12 hours (minimum for iOS)
          stopOnTerminate: false, // Continue after app is killed
          startOnBoot: true, // Start after device reboot
        });

        console.log('[Background Task] Background fetch task registered');
      } else {
        console.log('[Background Task] Background fetch task already registered');
      }
    } catch (error) {
      console.error('[Background Task] Error registering background task:', error);
    }
  }

  /**
   * Unregister background fetch task
   */
  async unregisterBackgroundTask(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('[Background Task] Background fetch task unregistered');
    } catch (error) {
      console.error('[Background Task] Error unregistering background task:', error);
    }
  }

  /**
   * Get background fetch status
   */
  async getStatus(): Promise<BackgroundFetch.BackgroundFetchStatus> {
    return await BackgroundFetch.getStatusAsync();
  }

  /**
   * Check if task is registered
   */
  async isTaskRegistered(): Promise<boolean> {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
  }
}

// Export singleton instance
export const backgroundTaskService = new BackgroundTaskService();
export { BACKGROUND_NOTIFICATION_TASK };
