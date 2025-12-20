import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../constants/colors';
import { notificationService } from '../services/notification.service';
import { databaseService } from '../services/database.service';
import { backgroundTaskService } from '../services/backgroundTask.service';

const NotificationDebugScreen: React.FC = () => {
  const [scheduledCount, setScheduledCount] = useState(0);
  const [dbCount, setDbCount] = useState(0);
  const [backgroundTaskStatus, setBackgroundTaskStatus] = useState('');
  const [isTaskRegistered, setIsTaskRegistered] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);

      // Get scheduled notifications from system
      const scheduled = await notificationService.getAllScheduledNotifications();
      setScheduledCount(scheduled.length);

      // Get notification IDs from database
      const dbNotifs = await databaseService.getAllScheduledNotificationIds();
      setDbCount(dbNotifs.length);

      // Get background task status
      const status = await backgroundTaskService.getStatus();
      const registered = await backgroundTaskService.isTaskRegistered();
      setBackgroundTaskStatus(getStatusText(status));
      setIsTaskRegistered(registered);

      // Get notification permissions
      const perms = await Notifications.getPermissionsAsync();
      setPermissions(perms);
    } catch (error) {
      console.error('Error loading debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: number): string => {
    switch (status) {
      case 1:
        return 'Available';
      case 2:
        return 'Restricted';
      case 0:
      default:
        return 'Denied';
    }
  };

  const handleTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from debug screen',
          data: { test: true },
        },
        trigger: {
          seconds: 5,
        },
      });
      Alert.alert('Success', 'Test notification will appear in 5 seconds');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRescheduleAll = async () => {
    try {
      setLoading(true);
      const events = await databaseService.getAllEvents();
      await notificationService.rescheduleAllNotifications(events);
      Alert.alert('Success', `Rescheduled notifications for ${events.length} events`);
      await loadDebugInfo();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Confirm',
      'Clear all scheduled notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await notificationService.cancelAllNotifications();
              Alert.alert('Success', 'All notifications cleared');
              await loadDebugInfo();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReregisterTask = async () => {
    try {
      setLoading(true);
      await backgroundTaskService.unregisterBackgroundTask();
      await backgroundTaskService.registerBackgroundTask();
      Alert.alert('Success', 'Background task re-registered');
      await loadDebugInfo();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewScheduled = async () => {
    try {
      const scheduled = await notificationService.getAllScheduledNotifications();
      const message = scheduled.map((notif, index) => {
        const trigger = notif.trigger as any;
        return `${index + 1}. ${notif.content.title}\n   Event: ${notif.content.data?.eventId}\n   Time: ${trigger.dateComponents ? JSON.stringify(trigger.dateComponents) : 'N/A'}`;
      }).join('\n\n');

      Alert.alert(
        `Scheduled Notifications (${scheduled.length})`,
        message || 'No scheduled notifications',
        [{ text: 'OK' }],
        { cancelable: true }
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Notification Debug</Text>

        {/* Status Cards */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Status Overview</Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>System Scheduled:</Text>
            <Text style={styles.statValue}>{scheduledCount}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Database Records:</Text>
            <Text style={styles.statValue}>{dbCount}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Permission Status:</Text>
            <Text style={[
              styles.statValue,
              permissions?.status === 'granted' ? styles.statusSuccess : styles.statusError
            ]}>
              {permissions?.status || 'Unknown'}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Background Task:</Text>
            <Text style={[
              styles.statValue,
              isTaskRegistered ? styles.statusSuccess : styles.statusWarning
            ]}>
              {isTaskRegistered ? 'Registered' : 'Not Registered'}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Fetch Status:</Text>
            <Text style={styles.statValue}>{backgroundTaskStatus}</Text>
          </View>
        </View>

        {/* Test Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧪 Test Actions</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleTestNotification}
            disabled={loading}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
            <Text style={styles.buttonText}>Send Test Notification (5s)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleViewScheduled}
            disabled={loading}
          >
            <Ionicons name="list-outline" size={20} color={COLORS.primary} />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              View Scheduled
            </Text>
          </TouchableOpacity>
        </View>

        {/* Management Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚙️ Management</Text>

          <TouchableOpacity
            style={[styles.button, styles.buttonInfo]}
            onPress={handleRescheduleAll}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
            <Text style={styles.buttonText}>Reschedule All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonWarning]}
            onPress={handleReregisterTask}
            disabled={loading}
          >
            <Ionicons name="construct-outline" size={20} color={COLORS.white} />
            <Text style={styles.buttonText}>Re-register Background Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={handleClearAll}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.white} />
            <Text style={styles.buttonText}>Clear All Notifications</Text>
          </TouchableOpacity>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={loadDebugInfo}
          disabled={loading}
        >
          <Ionicons name="reload-outline" size={20} color={COLORS.primary} />
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
            {loading ? 'Loading...' : 'Refresh Info'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusSuccess: {
    color: COLORS.success || '#4CAF50',
  },
  statusWarning: {
    color: COLORS.warning || '#FF9800',
  },
  statusError: {
    color: COLORS.error,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonInfo: {
    backgroundColor: '#2196F3',
  },
  buttonWarning: {
    backgroundColor: '#FF9800',
  },
  buttonDanger: {
    backgroundColor: COLORS.error,
  },
  buttonOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: COLORS.primary,
  },
});

export default NotificationDebugScreen;
