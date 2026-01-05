// Import environment variables
import {
  REACT_APP_API_DEV_URL,
  REACT_APP_API_PROD_URL,
  REACT_APP_API_TIMEOUT,
} from '@env';

// API Configuration
export const API_BASE_URL = __DEV__
  ? (REACT_APP_API_DEV_URL || 'http://localhost:3000/api')
  : REACT_APP_API_PROD_URL;

export const API_TIMEOUT = parseInt(REACT_APP_API_TIMEOUT || '30000', 10);

// Sync Configuration
export const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes
export const SYNC_RETRY_DELAY = 5 * 60 * 1000; // 5 minutes
export const MAX_SYNC_RETRIES = 3;

// Notification Configuration
export const NOTIFICATION_CHANNEL_ID = 'important-dates-reminders';
export const NOTIFICATION_CHANNEL_NAME = 'Nhắc nhở sự kiện';
export const DEFAULT_NOTIFICATION_TIME = { hour: 9, minute: 0 }; // 9:00 AM

// Database Configuration
export const DB_NAME = 'important_dates.db';
export const DB_VERSION = 1;

// AsyncStorage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  REFRESH_TOKEN: '@refresh_token',
  USER_DATA: '@user_data',
  IS_ANONYMOUS: '@is_anonymous',
  LAST_SYNC_VERSION: '@last_sync_version',
  LAST_SYNC_AT: '@last_sync_at',
  THEME_MODE: '@theme_mode',
  LANGUAGE: '@language',
  NOTIFICATION_SETTINGS: '@notification_settings',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Date Format
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Validation
export const MIN_TITLE_LENGTH = 3;
export const MAX_TITLE_LENGTH = 100;

// App Info
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Ngày Quan Trọng';

// Feature Flags
export const FEATURES = {
  ENABLE_ANALYTICS: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_LUNAR_CALENDAR: true,
  ENABLE_GIFT_SUGGESTIONS: true,
} as const;
