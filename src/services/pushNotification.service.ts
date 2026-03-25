import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api.service';

const DEVICE_ID_KEY = 'push_device_id';

async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Request permissions, get Expo push token, and register with server.
 * Should be called after a real (non-anonymous) user logs in.
 */
export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice) return; // simulators don't support push

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;
  const deviceId = await getOrCreateDeviceId();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  await apiService.post('/notifications/push-token/register', {
    token,
    deviceId,
    platform: Platform.OS,
    timezone,
  });
}

/**
 * Deactivate this device's push token on the server (logout / uninstall).
 */
export async function deactivatePushToken(): Promise<void> {
  const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) return;
  await apiService.delete('/notifications/push-token', { data: { deviceId } }).catch(() => {});
}

/**
 * Tell server to stop sending push for a specific event
 * (event deleted or notification disabled for a recurring event).
 */
export async function cancelEventPush(eventId: string): Promise<void> {
  await apiService.post('/notifications/push-token/cancel', { eventId }).catch(() => {});
}

/**
 * Restore server push for an event after re-enabling notifications.
 */
export async function restoreEventPush(eventId: string): Promise<void> {
  await apiService.post('/notifications/push-token/restore', { eventId }).catch(() => {});
}
