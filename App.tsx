import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/store/AuthContext';
import { EventsProvider } from './src/store/EventsContext';
import { SyncProvider } from './src/store/SyncContext';
import { NotificationProvider } from './src/store/NotificationContext';
import { ToastProvider } from './src/contexts/ToastContext';
import AppNavigator, { navigate } from './src/navigation/AppNavigator';
import { PermissionModal } from './src/components/PermissionModal';
import { notificationService } from './src/services/notification.service';
import { databaseService } from './src/services/database.service';
import { dataSeedService } from './src/services/dataSeed.service';
import { backgroundTaskService } from './src/services/backgroundTask.service';

// Configure how notifications are presented when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize app
    initializeApp();

    // Setup notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        // Navigate to event detail screen when user taps notification
        const eventId = response.notification.request.content.data?.eventId;
        if (eventId) {
          navigate('EventDetail', { eventId });
        }
      }
    );

    // Setup AppState listener to reschedule notifications on app resume
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      notificationListener.remove();
      responseListener.remove();
      appStateSubscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('App has come to foreground, reschedule notifications');
      // App has come to foreground - reschedule all notifications
      try {
        const events = await databaseService.getAllEvents();
        await notificationService.rescheduleAllNotifications(events);
      } catch (error) {
        console.error('Error rescheduling on app resume:', error);
      }
    }

    appState.current = nextAppState;
  };

  const initializeApp = async () => {
    try {
      // 1. Initialize database
      await databaseService.init();
      console.log('Database initialized');

      // 2. Seed default data if needed
      await dataSeedService.seedDefaultData();
      console.log('Default data seeded');

      // 3. Initialize notifications
      await notificationService.init();
      console.log('Notifications initialized');

      // 4. Register background task for notification management
      await backgroundTaskService.registerBackgroundTask();
      console.log('Background task registered');

      // 5. Initial notification reschedule
      const events = await databaseService.getAllEvents();
      await notificationService.rescheduleAllNotifications(events);
      console.log('Initial notifications scheduled');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  const handlePermissionResult = async (granted: boolean) => {
    if (granted) {
      console.log('Notification permission granted');
      // Reschedule notifications after permission granted
      try {
        const events = await databaseService.getAllEvents();
        await notificationService.rescheduleAllNotifications(events);
        console.log('Notifications rescheduled after permission granted');
      } catch (error) {
        console.error('Error rescheduling after permission:', error);
      }
    } else {
      console.log('Notification permission denied or skipped');
    }
  };

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <EventsProvider>
            <NotificationProvider>
              <SyncProvider>
                <AppNavigator />
                <StatusBar style="auto" />
                <PermissionModal onPermissionResult={handlePermissionResult} />
              </SyncProvider>
            </NotificationProvider>
          </EventsProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
