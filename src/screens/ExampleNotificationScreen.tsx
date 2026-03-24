import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useNotification } from '@contexts/NotificationContext';
import { COLORS } from '@themes/colors';
import { Ionicons } from '@expo/vector-icons';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

/**
 * Example screen demonstrating how to use NotificationContext
 * You can access notification data from any screen in your app
 */
const ExampleNotificationScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();

  const { message, image, upcomingEventsCount, hasUpcomingEvents } = useNotification();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Context Demo</Text>

      <View style={styles.card}>
        <Image source={image} style={{ width: 32, height: 32 }} />
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

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  message: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Manrope_600SemiBold',
  },
  infoValue: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: 'Manrope_700Bold',
  },
  note: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center',
  },
}));export default ExampleNotificationScreen;
