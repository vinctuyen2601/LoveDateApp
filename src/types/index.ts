// ==================== CHECKLIST TYPES ====================

export interface ChecklistItem {
  id: string;
  eventId: string;
  title: string;
  isCompleted: boolean;
  dueDaysBefore: number; // How many days before event this should be done
  displayOrder: number; // For sorting
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseChecklistItem {
  id: string;
  eventId: string;
  title: string;
  isCompleted: number; // SQLite boolean
  dueDaysBefore: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistTemplateItem {
  title: string;
  dueDaysBefore: number;
  order: number;
}

export interface ChecklistTemplate {
  id: string;
  eventCategory: string; // birthday, anniversary, holiday, default

  // Template Items
  items: ChecklistTemplateItem[];

  // Relationship-specific customization
  relationshipSpecific?: Record<string, ChecklistTemplateItem[]>;

  // CMS fields
  status?: 'draft' | 'published' | 'archived';
  version?: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== GIFT HISTORY TYPES ====================

export interface GiftHistoryItem {
  id: string;
  eventId: string;
  giftName: string;
  price?: number;
  rating?: number; // 1-5 stars
  purchaseUrl?: string;
  notes?: string;
  isPurchased: boolean;
  purchasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseGiftHistoryItem {
  id: string;
  eventId: string;
  giftName: string;
  price: number | null;
  rating: number | null;
  purchaseUrl: string | null;
  notes: string | null;
  isPurchased: number; // SQLite boolean
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIGiftSuggestion {
  name: string;
  description: string;
  priceRange: string;
  category: string;
  reasoning: string;
  purchaseLinks?: string[];
}

// ==================== EVENT TYPES ====================

export type RecurrenceType = "once" | "weekly" | "monthly" | "yearly";

export interface RecurrencePattern {
  type: RecurrenceType;
  // For weekly: dayOfWeek (0=Sunday, 1=Monday, ..., 6=Saturday)
  dayOfWeek?: number;
  // For monthly: dayOfMonth (1-31)
  dayOfMonth?: number;
  // For yearly: month (1-12) + day (1-31)
  month?: number;
  day?: number;
}

export interface ReminderSettings {
  remindDaysBefore: number[]; // [1, 7, 30] = nhắc 1 ngày, 1 tuần, 1 tháng trước
  customTimes?: Date[]; // Thời gian cụ thể để nhắc
  reminderTime?: { hour: number; minute: number }; // Giờ nhắc mặc định (default: giờ hiện tại)
}

export interface EventNote {
  year: number;
  gift?: string;
  activity?: string;
  note?: string;
  photos?: string[]; // URLs hoặc local paths
}

export interface Event {
  id: string; // local_timestamp_random hoặc server UUID
  title: string;
  eventDate: string; // ISO string
  isLunarCalendar: boolean;
  tags: string[]; // Replaces category  (e.g. ['birthday', 'wife', 'important'])
  reminderSettings: ReminderSettings;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern; // New: detailed recurrence info
  isDeleted: boolean;

  // Sync fields
  localId?: string;
  serverId?: string;
  version: number; // Timestamp for conflict resolution
  needsSync: boolean;

  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// ==================== AUTH TYPES ====================

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous?: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// ==================== SYNC TYPES ====================

export interface SyncPayload {
  events: Event[];
  lastSyncVersion: number;
}

export interface SyncConflict {
  clientEvent: Event;
  serverEvent: Event;
}

export interface SyncResponse {
  serverChanges: Event[];
  conflicts: SyncConflict[];
  processedEvents: {
    localId: string;
    serverId: string;
  }[];
  lastSyncVersion: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt?: string;
  lastSyncVersion: number;
  pendingCount: number;
  error?: string;
}

// ==================== NOTIFICATION TYPES ====================

export interface ScheduledNotification {
  id: string;
  eventId: string;
  title: string;
  body: string;
  triggerDate: Date;
  data?: Record<string, any>;
}

export type NotificationPriority = "urgent" | "important" | "reminder";

export type NotificationStatus =
  | "scheduled"    // Notification scheduled successfully
  | "delivered"    // Notification delivered to user
  | "failed"       // Scheduling failed
  | "cancelled"    // Manually cancelled
  | "expired";     // Passed scheduled time without delivery

export interface NotificationLog {
  id: string;
  eventId: string;
  notificationId?: string;
  daysBefore: number;
  scheduledAt: string;
  deliveredAt?: string;
  status: NotificationStatus;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseNotificationLog {
  id: string;
  eventId: string;
  notificationId: string | null;
  daysBefore: number;
  scheduledAt: string;
  deliveredAt: string | null;
  status: string;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== UI TYPES ====================

export interface EventCardProps {
  event: Event;
  onPress: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onEdit?: (event: Event) => void;
}

export interface CountdownInfo {
  isPast: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  displayText: string;
}

// ==================== NAVIGATION TYPES ====================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  AddEvent: undefined;
  EditEvent: { eventId: string };
  EventDetail: { eventId: string };
};

// ==================== GIFT & ACTIVITY SUGGESTIONS ====================

export interface GiftSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'gift' | 'experience' | 'activity' | 'romantic_plan';

  // Scoring Criteria (for filtering algorithm)
  category?: string[];
  budget?: string[];
  occasion?: string[];
  personality?: string[];
  hobbies?: string[];
  loveLanguage?: string[];
  gender?: 'Nam' | 'Nữ' | 'Khác';
  relationshipStage?: string[];

  // Details
  whyGreat?: string; // Lý do gợi ý này tốt
  tips?: string[]; // Array of tips

  // Related Content
  relatedProducts?: string[]; // Product IDs
  relatedArticles?: string[]; // Article IDs

  // CMS fields
  status?: 'draft' | 'published' | 'archived';
  version?: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Activity Suggestion types (Phase 2 - Task 5)
export interface ActivitySuggestion {
  id: string;
  name: string;
  category: 'restaurant' | 'activity' | 'location';
  location?: string; // Area/district (e.g., "Quận 1", "Thủ Đức")
  address?: string;
  priceRange?: '₫' | '₫₫' | '₫₫₫' | '₫₫₫₫'; // Similar to Google Maps
  rating?: number; // 1.0 - 5.0
  bookingUrl?: string;
  phoneNumber?: string;
  imageUrl?: string;
  description?: string;
  tags?: string[]; // e.g., ["Italian", "Romantic", "Outdoor"]

  // CMS fields
  status?: 'draft' | 'published' | 'archived';
  version?: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseActivitySuggestion {
  id: string;
  name: string;
  category: string;
  location: string | null;
  address: string | null;
  priceRange: string | null;
  rating: number | null;
  bookingUrl: string | null;
  phoneNumber: string | null;
  imageUrl: string | null;
  description: string | null;
  tags: string | null; // JSON string array
  createdAt: string;
  updatedAt: string;
}

// ==================== DATABASE TYPES ====================

export interface DatabaseEvent {
  id: string;
  title: string;
  eventDate: string;
  isLunarCalendar: number; // SQLite boolean
  tags: string; // JSON string array
  reminderSettings: string; // JSON string
  isRecurring: number; // SQLite boolean
  recurrencePattern: string | null; // JSON string
  isDeleted: number; // SQLite boolean
  localId: string | null;
  serverId: string | null;
  version: number;
  needsSync: number; // SQLite boolean
  createdAt: string;
  updatedAt: string;
}

export interface SyncMetadata {
  key: string;
  value: string;
  updatedAt: string;
}

// ==================== FORM TYPES ====================

export interface EventFormData {
  title: string;
  eventDate: Date;
  isLunarCalendar: boolean;
  tags: string[]; // Replaces category
  remindDaysBefore: number[];
  reminderTime?: { hour: number; minute: number }; // Giờ nhắc mặc định
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern; // Detailed recurrence information
}

export interface EventFormErrors {
  title?: string;
  eventDate?: string;
  tags?: string;
}

// ==================== ANALYTICS TYPES ====================

export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  eventsByTag: Record<string, number>; // Changed from category/relationship to tags
}

// ==================== LUNAR CALENDAR TYPES ====================

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  isLeapMonth: boolean;
}

export interface SolarDate {
  day: number;
  month: number;
  year: number;
}

// ==================== CONTEXT TYPES ====================

export interface AuthContextValue {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  linkedProviders: string[];
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  // 🆕 Linking methods
  linkWithEmailPassword: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  linkWithGoogle: () => Promise<void>;
  linkWithFacebook: () => Promise<void>;
  linkWithPhoneNumber: (
    phoneNumber: string
  ) => Promise<{ verificationId: string }>;
  completeLinkWithPhone: (
    verificationId: string,
    code: string
  ) => Promise<void>;
}

export interface EventsContextValue {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  addEvent: (event: EventFormData) => Promise<Event>;
  updateEvent: (id: string, event: Partial<EventFormData>) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  getEventById: (id: string) => Event | undefined;
  getUpcomingEvents: (days?: number) => Event[];
  getEventsByTag: (tag: string) => Event[]; // Changed from getEventsByCategory
  searchEvents: (query: string) => Event[];
}

export interface SyncContextValue {
  syncStatus: SyncStatus;
  sync: () => Promise<void>;
  resolveConflict: (
    conflict: SyncConflict,
    keepLocal: boolean
  ) => Promise<void>;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ==================== ERROR TYPES ====================

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class SyncError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = "SyncError";
  }
}

export class AuthError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
    public readonly details?: any,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Error messages by status code
export const API_ERROR_MESSAGES: Record<number, string> = {
  400: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền truy cập tài nguyên này.",
  404: "Không tìm thấy tài nguyên yêu cầu.",
  500: "Lỗi hệ thống. Vui lòng thử lại sau.",
  502: "Lỗi kết nối máy chủ. Vui lòng thử lại sau.",
  503: "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.",
};

export const NETWORK_ERROR_MESSAGE =
  "Không có kết nối mạng. Vui lòng kiểm tra kết nối internet.";
export const TIMEOUT_ERROR_MESSAGE = "Yêu cầu quá lâu. Vui lòng thử lại.";
export const UNKNOWN_ERROR_MESSAGE =
  "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";

// ==================== CONSTANTS ====================

export const REMIND_OPTIONS = [
  { value: 0, label: "Trong ngày" },
  { value: 1, label: "1 ngày trước" },
  { value: 3, label: "3 ngày trước" },
  { value: 7, label: "1 tuần trước" },
  { value: 14, label: "2 tuần trước" },
  { value: 30, label: "1 tháng trước" },
];

// ==================== PREDEFINED TAGS ====================
// Tags managed on server, synced to local DB
export const PREDEFINED_TAGS = [
  { value: "birthday", label: "Sinh nhật", icon: "gift", color: "#FF6B6B" },
  { value: "anniversary", label: "Kỷ niệm", icon: "heart", color: "#FF69B4" },
  { value: "wife", label: "Vợ", icon: "heart", color: "#E74C3C" },
  { value: "husband", label: "Chồng", icon: "heart-circle", color: "#3498DB" },
  { value: "family", label: "Gia đình", icon: "people", color: "#9B59B6" },
];

// ==================== ARTICLE TYPES ====================

export type ArticleCategory =
  | "gifts"
  | "dates"
  | "communication"
  | "zodiac"
  | "personality"
  | "all";

export interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  icon: string;
  color: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  imageUrl?: string;
  author?: string;
  readTime?: number;
  tags?: string[];
  likes: number;
  views: number;
  isFeatured: boolean;
  publishedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseArticle {
  id: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  content: string;
  status: string;
  imageUrl: string | null;
  author: string | null;
  readTime: number | null;
  tags: string | null; // JSON string
  likes: number;
  views: number;
  isFeatured: number; // SQLite boolean
  publishedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== SURVEY TYPES ====================

export type SurveyType =
  | "mbti"
  | "love_language"
  | "personality"
  | "compatibility";
export type SurveyStatus = "draft" | "published" | "archived";

export interface SurveyQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  dimensionA: string;
  dimensionB: string;
  category?: string;
}

export interface SurveyResultDetail {
  type: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  loveStyle?: string;
  giftIdeas?: string[];
  compatibility?: {
    best: string[];
    good: string[];
    challenging: string[];
  };
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  type: SurveyType;
  status: SurveyStatus;
  icon?: string;
  color?: string;
  questions: SurveyQuestion[];
  results?: Record<string, SurveyResultDetail>;
  totalTaken: number;
  isFeatured: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSurvey {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  icon: string | null;
  color: string | null;
  questions: string; // JSON string
  results: string | null; // JSON string
  totalTaken: number;
  isFeatured: number; // SQLite boolean
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== GAMIFICATION TYPES (Phase 3 - Task 7) ====================

export interface UserStats {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalEventsCreated: number;
  totalEventsCompleted: number;
  totalChecklistsCompleted: number;
  totalGiftsPurchased: number;
  lastActivityDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseUserStats {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalEventsCreated: number;
  totalEventsCompleted: number;
  totalChecklistsCompleted: number;
  totalGiftsPurchased: number;
  lastActivityDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BadgeType =
  | 'perfect_partner'      // 10 events không quên
  | 'thoughtful'           // 5 quà được rate 5 sao
  | 'streak_master'        // 30 ngày streak
  | 'planner'              // 20 checklists hoàn thành 100%
  | 'early_bird'           // 10 events created 7+ days in advance
  | 'consistent'           // 7 ngày streak
  | 'organizer'            // 50+ checklist items completed
  | 'generous'             // 10+ gifts purchased
  | 'beginner';            // First event created

export interface Achievement {
  id: string;
  userId: string;
  badgeType: BadgeType;
  badgeName: string;
  badgeDescription?: string;
  earnedAt: string;
  notified: boolean;
}

export interface DatabaseAchievement {
  id: string;
  userId: string;
  badgeType: string;
  badgeName: string;
  badgeDescription: string | null;
  earnedAt: string;
  notified: number; // SQLite boolean
}

export interface BadgeDefinition {
  id: string;
  badgeType: BadgeType;
  name: string;
  description: string;
  icon: string; // Ionicons name
  color: string;

  // Requirements (for unlocking logic)
  requirements: Record<string, any>; // e.g., {minEvents: 1} or {minStreak: 7}

  // Rewards
  rewards?: {
    points?: number;
    premiumDays?: number;
  };

  // CMS fields
  status?: 'draft' | 'published' | 'archived';
  version?: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== PREMIUM TYPES (Phase 3 - Task 8) ====================

export type SubscriptionType = 'free' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial';
export type Platform = 'ios' | 'android';

export interface PremiumSubscription {
  id: string;
  userId: string;
  subscriptionType: SubscriptionType;
  status: SubscriptionStatus;
  purchaseToken?: string;
  productId: string;
  purchaseDate: string;
  expiryDate?: string;
  autoRenew: boolean;
  platform: Platform;
  createdAt: string;
  updatedAt: string;
}

export interface DatabasePremiumSubscription {
  id: string;
  userId: string;
  subscriptionType: string;
  status: string;
  purchaseToken: string | null;
  productId: string;
  purchaseDate: string;
  expiryDate: string | null;
  autoRenew: number; // SQLite boolean
  platform: string;
  createdAt: string;
  updatedAt: string;
}

export interface PremiumFeatures {
  unlimitedEvents: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customThemes: boolean;
  exportData: boolean;
  adFree: boolean;
}

export interface SubscriptionProduct {
  id: string;
  planType: SubscriptionType;
  name: string;
  description?: string;

  // Pricing
  price: number;
  currency: string; // 'VND'
  billingCycle?: 'monthly' | 'yearly' | 'one-time';

  // Limits & Features
  features: Record<string, any>; // e.g., {maxEvents: 10, hasAnalytics: false}

  // Display
  isPopular?: boolean;
  displayOrder?: number;

  // CMS fields
  status?: 'draft' | 'published' | 'archived';
  version?: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== CONTENT SYNC TYPES ====================

export interface ContentSyncMetadata {
  lastArticleVersion: number;
  lastSurveyVersion: number;
  lastProductVersion: number;
  lastActivityVersion: number;
  lastGiftVersion: number;
  lastChecklistVersion: number;
  lastBadgeVersion: number;
  lastPlanVersion: number;
  lastArticleSyncAt?: string;
  lastSurveySyncAt?: string;
  lastProductSyncAt?: string;
  lastActivitySyncAt?: string;
  lastGiftSyncAt?: string;
  lastChecklistSyncAt?: string;
  lastBadgeSyncAt?: string;
  lastPlanSyncAt?: string;
}

export interface ContentSyncResponse {
  articles: Article[];
  surveys: Survey[];
  products: AffiliateProduct[];
  activities: ActivitySuggestion[];
  giftSuggestions: GiftSuggestion[];
  checklistTemplates: ChecklistTemplate[];
  badgeDefinitions: BadgeDefinition[];
  subscriptionPlans: SubscriptionProduct[];
  lastArticleVersion: number;
  lastSurveyVersion: number;
  lastProductVersion: number;
  lastActivityVersion: number;
  lastGiftVersion: number;
  lastChecklistVersion: number;
  lastBadgeVersion: number;
  lastPlanVersion: number;
  syncedAt: string;
}

// ==================== AFFILIATE PRODUCT TYPES ====================

export type AffiliateCategory = 'gift' | 'restaurant' | 'hotel' | 'spa' | 'travel';

export interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  category: AffiliateCategory;
  subcategory: string;
  priceRange: string;
  price?: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  galleryUrls?: string[];
  affiliateUrl: string;
  affiliatePartner?: string;
  occasion?: string[];
  budget?: string[];
  tags?: string[];
  icon: string;
  color: string;
  isFeatured: boolean;
  isPopular: boolean;

  // CMS fields
  status?: 'draft' | 'published' | 'archived';
  version?: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
