import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PremiumSubscription,
  DatabasePremiumSubscription,
  SubscriptionType,
  SubscriptionStatus,
  Platform,
  PremiumFeatures,
  SubscriptionProduct,
} from '../types';

/**
 * Premium Service (Phase 3 - Task 8: Premium Features)
 *
 * Manages premium subscriptions and feature gating:
 * - Subscription status checking
 * - Feature access control
 * - Purchase management
 * - Trial period handling
 */

// ==================== CONSTANTS ====================

const PREMIUM_STORAGE_KEY = '@premium_status';
const FREE_EVENT_LIMIT = 10;
const TRIAL_DURATION_DAYS = 7;

export const SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  {
    id: 'monthly_4.99',
    planType: 'monthly',
    name: 'Gói tháng',
    description: 'Thanh toán hàng tháng',
    price: 99000,
    currency: 'VND',
    billingCycle: 'monthly',
    features: {
      maxEvents: -1, // unlimited
      hasAnalytics: true,
      hasExport: true,
      hasCustomThemes: true,
      hasPrioritySupport: true,
      adFree: true,
      featureList: [
        'Không giới hạn số sự kiện',
        'Phân tích nâng cao',
        'Xuất dữ liệu',
        'Giao diện tùy chỉnh',
        'Hỗ trợ ưu tiên',
        'Không quảng cáo',
      ],
    },
    displayOrder: 1,
  },
  {
    id: 'yearly_49.99',
    planType: 'yearly',
    name: 'Gói năm',
    description: 'Tiết kiệm 17%',
    price: 990000,
    currency: 'VND',
    billingCycle: 'yearly',
    features: {
      maxEvents: -1, // unlimited
      hasAnalytics: true,
      hasExport: true,
      hasCustomThemes: true,
      hasPrioritySupport: true,
      adFree: true,
      hasCloudBackup: true,
      hasEarlyAccess: true,
      featureList: [
        'Tất cả tính năng gói tháng',
        'Tiết kiệm 17% (~2 tháng miễn phí)',
        'Ưu tiên truy cập tính năng mới',
        'Sao lưu đám mây không giới hạn',
      ],
    },
    isPopular: true,
    displayOrder: 2,
  },
];

// ==================== CONVERTERS ====================

function dbSubscriptionToSubscription(
  dbSub: DatabasePremiumSubscription
): PremiumSubscription {
  return {
    id: dbSub.id,
    userId: dbSub.userId,
    subscriptionType: dbSub.subscriptionType as SubscriptionType,
    status: dbSub.status as SubscriptionStatus,
    purchaseToken: dbSub.purchaseToken || undefined,
    productId: dbSub.productId,
    purchaseDate: dbSub.purchaseDate,
    expiryDate: dbSub.expiryDate || undefined,
    autoRenew: Boolean(dbSub.autoRenew),
    platform: dbSub.platform as Platform,
    createdAt: dbSub.createdAt,
    updatedAt: dbSub.updatedAt,
  };
}

// ==================== SUBSCRIPTION MANAGEMENT ====================

/**
 * Get user's subscription
 */
export async function getUserSubscription(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<PremiumSubscription | null> {
  try {
    const result = await db.getFirstAsync<DatabasePremiumSubscription>(
      'SELECT * FROM premium_subscriptions WHERE userId = ?',
      [userId]
    );

    if (!result) {
      return null;
    }

    return dbSubscriptionToSubscription(result);
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

/**
 * Create or update subscription
 */
export async function upsertSubscription(
  db: SQLite.SQLiteDatabase,
  userId: string,
  data: {
    subscriptionType: SubscriptionType;
    status: SubscriptionStatus;
    productId: string;
    purchaseDate: string;
    expiryDate?: string;
    purchaseToken?: string;
    platform: Platform;
  }
): Promise<PremiumSubscription> {
  try {
    const now = new Date().toISOString();
    const existing = await getUserSubscription(db, userId);

    if (existing) {
      // Update existing subscription
      await db.runAsync(
        `UPDATE premium_subscriptions
         SET subscriptionType = ?, status = ?, productId = ?,
             purchaseDate = ?, expiryDate = ?, purchaseToken = ?,
             platform = ?, autoRenew = 1, updatedAt = ?
         WHERE userId = ?`,
        [
          data.subscriptionType,
          data.status,
          data.productId,
          data.purchaseDate,
          data.expiryDate || null,
          data.purchaseToken || null,
          data.platform,
          now,
          userId,
        ]
      );
    } else {
      // Create new subscription
      const id = `sub_${userId}_${Date.now()}`;
      await db.runAsync(
        `INSERT INTO premium_subscriptions
         (id, userId, subscriptionType, status, productId, purchaseDate,
          expiryDate, purchaseToken, platform, autoRenew, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          id,
          userId,
          data.subscriptionType,
          data.status,
          data.productId,
          data.purchaseDate,
          data.expiryDate || null,
          data.purchaseToken || null,
          data.platform,
          now,
          now,
        ]
      );
    }

    // Update cache
    await updatePremiumStatusCache(userId, data.subscriptionType, data.status);

    const updated = await getUserSubscription(db, userId);
    return updated!;
  } catch (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<void> {
  try {
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE premium_subscriptions
       SET status = 'cancelled', autoRenew = 0, updatedAt = ?
       WHERE userId = ?`,
      [now, userId]
    );

    // Update cache
    await updatePremiumStatusCache(userId, 'free', 'expired');
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

// ==================== PREMIUM STATUS CHECKING ====================

/**
 * Check if user is premium (cached)
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  try {
    const cached = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
    if (cached) {
      const { userId: cachedUserId, isPremium, timestamp } = JSON.parse(cached);
      // Cache valid for 1 hour
      if (
        cachedUserId === userId &&
        Date.now() - timestamp < 3600000
      ) {
        return isPremium;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

/**
 * Check if user is premium (database)
 */
export async function checkPremiumStatus(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<{ isPremium: boolean; subscription: PremiumSubscription | null }> {
  try {
    const subscription = await getUserSubscription(db, userId);

    if (!subscription) {
      return { isPremium: false, subscription: null };
    }

    // Check if subscription is active
    const isActive =
      subscription.status === 'active' || subscription.status === 'trial';

    // Check if expired
    if (subscription.expiryDate) {
      const expiryDate = new Date(subscription.expiryDate);
      if (expiryDate < new Date()) {
        // Mark as expired
        await db.runAsync(
          'UPDATE premium_subscriptions SET status = ? WHERE userId = ?',
          ['expired', userId]
        );
        return { isPremium: false, subscription };
      }
    }

    // Update cache
    await updatePremiumStatusCache(
      userId,
      subscription.subscriptionType,
      subscription.status
    );

    return { isPremium: isActive, subscription };
  } catch (error) {
    console.error('Error checking premium status:', error);
    return { isPremium: false, subscription: null };
  }
}

/**
 * Update premium status cache
 */
async function updatePremiumStatusCache(
  userId: string,
  subscriptionType: SubscriptionType,
  status: SubscriptionStatus
): Promise<void> {
  try {
    const isPremium =
      (subscriptionType === 'monthly' || subscriptionType === 'yearly') &&
      (status === 'active' || status === 'trial');

    await AsyncStorage.setItem(
      PREMIUM_STORAGE_KEY,
      JSON.stringify({
        userId,
        isPremium,
        subscriptionType,
        status,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Error updating premium cache:', error);
  }
}

// ==================== FEATURE GATING ====================

/**
 * Get premium features for user
 */
export function getPremiumFeatures(isPremium: boolean): PremiumFeatures {
  return {
    unlimitedEvents: isPremium,
    advancedAnalytics: isPremium,
    prioritySupport: isPremium,
    customThemes: isPremium,
    exportData: isPremium,
    adFree: isPremium,
  };
}

/**
 * Check if user can create event
 */
export async function canCreateEvent(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<{ canCreate: boolean; reason?: string; limit?: number }> {
  try {
    const { isPremium } = await checkPremiumStatus(db, userId);

    if (isPremium) {
      return { canCreate: true };
    }

    // Check event count for free users
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM events WHERE isDeleted = 0'
    );

    const eventCount = result?.count || 0;

    if (eventCount >= FREE_EVENT_LIMIT) {
      return {
        canCreate: false,
        reason: `Bạn đã đạt giới hạn ${FREE_EVENT_LIMIT} sự kiện của gói miễn phí. Nâng cấp lên Premium để tạo không giới hạn!`,
        limit: FREE_EVENT_LIMIT,
      };
    }

    return { canCreate: true };
  } catch (error) {
    console.error('Error checking event creation permission:', error);
    return { canCreate: true }; // Default to allow
  }
}

/**
 * Start free trial
 */
export async function startFreeTrial(
  db: SQLite.SQLiteDatabase,
  userId: string,
  platform: Platform
): Promise<PremiumSubscription> {
  try {
    const purchaseDate = new Date().toISOString();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + TRIAL_DURATION_DAYS);

    return await upsertSubscription(db, userId, {
      subscriptionType: 'monthly',
      status: 'trial',
      productId: 'trial_7days',
      purchaseDate,
      expiryDate: expiryDate.toISOString(),
      platform,
    });
  } catch (error) {
    console.error('Error starting free trial:', error);
    throw error;
  }
}

/**
 * Has user used trial
 */
export async function hasUsedTrial(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<boolean> {
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM premium_subscriptions WHERE userId = ? AND status = ?',
      [userId, 'trial']
    );
    return (result?.count || 0) > 0;
  } catch (error) {
    console.error('Error checking trial usage:', error);
    return false;
  }
}

// ==================== MOCK PURCHASE (For Development) ====================

/**
 * Mock purchase for development/testing
 */
export async function mockPurchase(
  db: SQLite.SQLiteDatabase,
  userId: string,
  productId: string,
  platform: Platform = 'android'
): Promise<PremiumSubscription> {
  try {
    const product = SUBSCRIPTION_PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const purchaseDate = new Date().toISOString();
    let expiryDate: string | undefined;

    if (product.planType === 'monthly') {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);
      expiryDate = expiry.toISOString();
    } else if (product.planType === 'yearly') {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      expiryDate = expiry.toISOString();
    }

    return await upsertSubscription(db, userId, {
      subscriptionType: product.planType,
      status: 'active',
      productId,
      purchaseDate,
      expiryDate,
      purchaseToken: `mock_token_${Date.now()}`,
      platform,
    });
  } catch (error) {
    console.error('Error mock purchase:', error);
    throw error;
  }
}
