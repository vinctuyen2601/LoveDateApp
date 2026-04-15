import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { getAllEvents, DB_NAME } from './database.service';
import { scheduleUpcomingNotifications } from './notificationScheduler.service';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

/**
 * Background task to reschedule notifications
 * Chạy định kỳ kể cả khi app đóng hoàn toàn.
 * Mở DB trực tiếp — không dùng React context (không tồn tại trong background).
 */
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log('[Background Task] Running notification reschedule task');

    // Mở DB trực tiếp, không qua SQLiteProvider/React context
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    const events = await getAllEvents(db);

    await scheduleUpcomingNotifications(events);

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
    if (Platform.OS === 'web') return;
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
    const status = await BackgroundFetch.getStatusAsync();
    return status ?? BackgroundFetch.BackgroundFetchStatus.Available;
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
