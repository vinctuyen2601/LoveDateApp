import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotification } from '../store/NotificationContext';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

/**
 * Example screen demonstrating how to use NotificationContext
 * You can access notification data from any screen in your app
 */
const ExampleNotificationScreen: React.FC = () => {
  const { message, icon, upcomingEventsCount, hasUpcomingEvents } = useNotification();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Context Demo</Text>

      <View style={styles.card}>
        <Ionicons name={icon} size={32} color={COLORS.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Has Upcoming Events:</Text>
        <Text style={styles.infoValue}>{hasUpcomingEvents ? 'Yes' : 'No'}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Upcoming Events Count:</Text>
        <Text style={styles.infoValue}>{upcomingEventsCount}</Text>
      </View>

      <Text style={styles.note}>
        This data is accessible from any screen in the app through useNotification() hook.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  message: {
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default ExampleNotificationScreen;
