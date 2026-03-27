import "@react-native-firebase/app"; // Must be first — initializes Firebase before anything else
import "react-native-gesture-handler"; // Must be before any navigation imports
import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppState, AppStateStatus, Platform, Text, TextInput } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import * as Notifications from "expo-notifications";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { AuthProvider } from "./src/contexts/AuthContext";
import { MasterDataProvider } from "./src/contexts/MasterDataContext";
import { AchievementProvider } from "./src/contexts/AchievementContext";
import { EventsProvider } from "./src/contexts/EventsContext";
import { SyncProvider } from "./src/contexts/SyncContext";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import { ToastProvider } from "./src/contexts/ToastContext";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import AppNavigator, { navigate } from "./src/navigation/AppNavigator";
import { PermissionModal } from "./src/components/organisms/PermissionModal";
import TodayEventPopup from "./src/components/organisms/TodayEventPopup";
import { notificationEnhancedService } from "./src/services/notificationEnhanced.service";
import { scheduleUpcomingNotifications } from "./src/services/notificationScheduler.service";
import { NotificationUtils } from "./src/lib/notification.utils";
import * as DB from "./src/services/database.service";
import { dataSeedService } from "./src/services/dataSeed.service";
import { backgroundTaskService } from "./src/services/backgroundTask.service";
import "./src/lib/calendar.locale";

// Hold splash screen until fonts are ready
SplashScreen.preventAutoHideAsync();

// Apply Manrope as the default font for all Text and TextInput components
(Text as any).defaultProps = { ...(Text as any).defaultProps, style: { fontFamily: "Manrope_400Regular" } };
(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, style: { fontFamily: "Manrope_400Regular" } };

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

// Handles killed-state notification tap — uses a hook not available on web
function KilledStateNotifHandler({
  onResponse,
}: {
  onResponse: (r: Notifications.NotificationResponse) => void;
}) {
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (lastResponse) onResponse(lastResponse);
  }, [lastResponse]);
  return null;
}

// Inner component that uses SQLite context
function AppContent() {
  const db = useSQLiteContext();
  const appState = useRef(AppState.currentState);
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    if (!data) return;

    const screen = data.screen as string | undefined;

    switch (screen) {
      case "EventDetail":
        if (data.eventId) navigate("EventDetail", { eventId: data.eventId });
        break;
      case "Home":
        navigate("Main", { screen: "Home" });
        break;
      case "Connections":
        navigate("Main", { screen: "Connections" });
        break;
      case "ArticleDetail":
        if (data.articleId) navigate("ArticleDetail", { articleId: data.articleId });
        break;
      default:
        // Backward compatible: nếu không có screen nhưng có eventId
        if (data.eventId) navigate("EventDetail", { eventId: data.eventId });
        break;
    }
  };


  useEffect(() => {
    // Initialize app
    initializeApp();

    if (Platform.OS === 'web') return;

    // Setup notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    // Handle tap when app is in background/foreground
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response);
      });

    // Setup AppState listener to reschedule notifications on app resume
    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
      appStateSubscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // App has come to foreground - reschedule all notifications
      try {
        const events = await DB.getAllEvents(db);
        await scheduleUpcomingNotifications(events);
      } catch (error) {
        console.error("Error rescheduling on app resume:", error);
      }
    }

    appState.current = nextAppState;
  };

  const initializeApp = async () => {
    try {
      console.log("🚀 Initializing app with SQLiteProvider...");

      // Database is already initialized by SQLiteProvider!
      // Just need to run migrations
      await DB.initializeTables(db);
      console.log("✅ Database tables initialized");

      // Set db instance for legacy compatibility layer
      // This allows old code to keep working while we migrate
      (DB as any).databaseService.setDb(db);
      console.log("✅ Legacy database service configured");

      // 2. Seed default data if needed (using legacy compatibility layer)
      await dataSeedService.seedDefaultData();
      console.log("✅ Default data seeded");

      // 2.5. Seed activity suggestions (Phase 2 - Task 5)
      await dataSeedService.seedActivitySuggestions(db);
      console.log("✅ Activity suggestions seeded");

      // 3. Initialize enhanced notifications with database
      await notificationEnhancedService.init(db);
      console.log("✅ Enhanced notifications initialized");

      // 4. Register background task for notification management
      await backgroundTaskService.registerBackgroundTask();
      console.log("✅ Background task registered");

      // 5. Initial notification schedule for upcoming window
      const events = await DB.getAllEvents(db);
      await scheduleUpcomingNotifications(events);
      console.log("✅ Initial notifications scheduled");
    } catch (error) {
      console.error("❌ Failed to initialize app:", error);
    }
  };

  const handlePermissionResult = async (granted: boolean) => {
    if (granted) {
      console.log("Notification permission granted");
      // Reschedule notifications after permission granted
      try {
        await NotificationUtils.setupNotificationChannels();
        const events = await DB.getAllEvents(db);
        await scheduleUpcomingNotifications(events);
        console.log("Notifications rescheduled after permission granted");
      } catch (error) {
        console.error("Error rescheduling after permission:", error);
      }
    } else {
      console.log("Notification permission denied or skipped");
    }
  };

  return (
    <ThemeProvider>
    <SafeAreaProvider>
      <ToastProvider>
        <MasterDataProvider>
          <AuthProvider>
            <AchievementProvider>
              <EventsProvider>
                <NotificationProvider>
                  <SyncProvider>
                    <AppNavigator />
                    {Platform.OS !== 'web' && (
                      <KilledStateNotifHandler onResponse={handleNotificationResponse} />
                    )}
                    <StatusBar style="auto" />
                    <TodayEventPopup />
                    <PermissionModal
                      onPermissionResult={handlePermissionResult}
                    />
                  </SyncProvider>
                </NotificationProvider>
              </EventsProvider>
            </AchievementProvider>
          </AuthProvider>
        </MasterDataProvider>
      </ToastProvider>
    </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SQLiteProvider databaseName={DB.DB_NAME}>
      <AppContent />
    </SQLiteProvider>
  );
}
