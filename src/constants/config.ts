// Import environment variables
import {
  REACT_APP_API_DEV_URL,
  REACT_APP_API_PROD_URL,
  REACT_APP_API_TIMEOUT,
  REACT_APP_WEB_URL,
} from "@env";

// API Configuration
export const API_BASE_URL = __DEV__
  ? REACT_APP_API_DEV_URL || "http://localhost:3000/api"
  : REACT_APP_API_PROD_URL;

export const API_TIMEOUT = parseInt(REACT_APP_API_TIMEOUT || "30000", 10);

// Sync Configuration
export const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes
export const SYNC_RETRY_DELAY = 5 * 60 * 1000; // 5 minutes
export const MAX_SYNC_RETRIES = 3;

// Notification Configuration
export const NOTIFICATION_CHANNEL_ID = "love-date-reminders";
export const NOTIFICATION_CHANNEL_NAME = "Nhắc nhở sự kiện";
export const DEFAULT_NOTIFICATION_TIME = { hour: 9, minute: 0 }; // 9:00 AM

// Database Configuration
export const DB_NAME = "important_dates.db";
export const DB_VERSION = 1;

// AsyncStorage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "@auth_token",
  REFRESH_TOKEN: "@refresh_token",
  USER_DATA: "@user_data",
  IS_ANONYMOUS: "@is_anonymous",
  LAST_SYNC_VERSION: "@last_sync_version",
  LAST_SYNC_AT: "@last_sync_at",
  THEME_MODE: "@theme_mode",
  LANGUAGE: "@language",
  NOTIFICATION_SETTINGS: "@notification_settings",

  // Content Cache Keys (CMS)
  ARTICLES_CACHE: "@lovedate_articles_cache",
  ARTICLES_TIMESTAMP: "@lovedate_articles_cache_timestamp",
  AFFILIATE_PRODUCTS_CACHE: "@lovedate_affiliate_products_cache",
  AFFILIATE_PRODUCTS_TIMESTAMP: "@lovedate_affiliate_products_cache_timestamp",
  SURVEYS_CACHE: "@lovedate_surveys_cache",
  SURVEYS_TIMESTAMP: "@lovedate_surveys_cache_timestamp",
  ACTIVITIES_CACHE: "@lovedate_activities_cache",
  ACTIVITIES_TIMESTAMP: "@lovedate_activities_cache_timestamp",
  GIFT_SUGGESTIONS_CACHE: "@lovedate_gift_suggestions_cache",
  GIFT_SUGGESTIONS_TIMESTAMP: "@lovedate_gift_suggestions_cache_timestamp",
  CHECKLIST_TEMPLATES_CACHE: "@lovedate_checklist_templates_cache",
  CHECKLIST_TEMPLATES_TIMESTAMP:
    "@lovedate_checklist_templates_cache_timestamp",
  BADGE_DEFINITIONS_CACHE: "@lovedate_badge_definitions_cache",
  BADGE_DEFINITIONS_TIMESTAMP: "@lovedate_badge_definitions_cache_timestamp",
  SUBSCRIPTION_PLANS_CACHE: "@lovedate_subscription_plans_cache",
  SUBSCRIPTION_PLANS_TIMESTAMP: "@lovedate_subscription_plans_cache_timestamp",

  // Version Tracking (CMS Sync)
  LAST_ARTICLE_VERSION: "@last_article_version",
  LAST_SURVEY_VERSION: "@last_survey_version",
  LAST_PRODUCT_VERSION: "@last_product_version",
  LAST_ACTIVITY_VERSION: "@last_activity_version",
  LAST_GIFT_VERSION: "@last_gift_version",
  LAST_CHECKLIST_VERSION: "@last_checklist_version",
  LAST_BADGE_VERSION: "@last_badge_version",
  LAST_PLAN_VERSION: "@last_plan_version",
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Date Format
export const DATE_FORMAT = "dd/MM/yyyy";
export const DATETIME_FORMAT = "dd/MM/yyyy HH:mm";
export const TIME_FORMAT = "HH:mm";

// Validation
export const MIN_TITLE_LENGTH = 3;
export const MAX_TITLE_LENGTH = 100;

// App Info
export const APP_VERSION = "1.0.0";
export const APP_NAME = "LoveDate";

// Web URL (for sharing links)
export const WEB_BASE_URL = REACT_APP_WEB_URL || "https://ngayyeuthuong.com";

// Feature Flags
export const FEATURES = {
  ENABLE_ANALYTICS: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_LUNAR_CALENDAR: true,
  ENABLE_GIFT_SUGGESTIONS: true,
  ENABLE_CMS_SYNC: true, // Enable CMS content sync
} as const;

// CMS API Endpoints
export const CMS_ENDPOINTS = {
  ARTICLES: "/api/articles",
  PRODUCTS: "/api/products",
  ACTIVITIES: "/api/activities",
  SURVEYS: "/api/surveys",
  GIFT_SUGGESTIONS: "/api/gift-suggestions",
  CHECKLIST_TEMPLATES: "/api/checklist-templates",
  BADGE_DEFINITIONS: "/api/badge-definitions",
  SUBSCRIPTION_PLANS: "/api/subscription-plans",
  CONTENT_SYNC: "/api/sync/content",
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DURATION: 1000 * 60 * 60, // 1 hour
  MAX_AGE: 1000 * 60 * 60 * 24, // 24 hours max cache age
} as const;
