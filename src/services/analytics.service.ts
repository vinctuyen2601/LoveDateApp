import * as SQLite from 'expo-sqlite';
import { Event } from '../types';

/**
 * Analytics Service (Phase 2 - Task 6)
 *
 * Provides statistics and insights about:
 * - Events (total, upcoming, past, by tag)
 * - Gift spending
 * - Checklist completion rates
 * - Trends over time
 */

// ==================== EVENT STATISTICS ====================

export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  eventsByTag: { tag: string; count: number }[];
  recurringEvents: number;
  lunarCalendarEvents: number;
}

/**
 * Get comprehensive event statistics
 */
export async function getEventStats(db: SQLite.SQLiteDatabase): Promise<EventStats> {
  try {
    // Total events (excluding deleted)
    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM events WHERE isDeleted = 0'
    );
    const totalEvents = totalResult?.count || 0;

    // Upcoming events (from today onwards)
    const now = new Date().toISOString();
    const upcomingResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM events WHERE isDeleted = 0 AND eventDate >= ?',
      [now]
    );
    const upcomingEvents = upcomingResult?.count || 0;

    // Past events
    const pastEvents = totalEvents - upcomingEvents;

    // Recurring events
    const recurringResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM events WHERE isDeleted = 0 AND isRecurring = 1'
    );
    const recurringEvents = recurringResult?.count || 0;

    // Lunar calendar events
    const lunarResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM events WHERE isDeleted = 0 AND isLunarCalendar = 1'
    );
    const lunarCalendarEvents = lunarResult?.count || 0;

    // Events by tag (aggregate from JSON arrays)
    const events = await db.getAllAsync<{ tags: string }>(
      'SELECT tags FROM events WHERE isDeleted = 0 AND tags IS NOT NULL'
    );

    const tagCounts: Record<string, number> = {};
    events.forEach((event) => {
      try {
        const tags = JSON.parse(event.tags) as string[];
        tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      } catch (error) {
        // Skip invalid JSON
      }
    });

    const eventsByTag = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      eventsByTag,
      recurringEvents,
      lunarCalendarEvents,
    };
  } catch (error) {
    console.error('Error getting event stats:', error);
    return {
      totalEvents: 0,
      upcomingEvents: 0,
      pastEvents: 0,
      eventsByTag: [],
      recurringEvents: 0,
      lunarCalendarEvents: 0,
    };
  }
}

// ==================== GIFT STATISTICS ====================

export interface GiftStats {
  totalGifts: number;
  purchasedGifts: number;
  averagePrice: number;
  totalSpent: number;
  averageRating: number;
  giftsByEvent: { eventId: string; eventTitle: string; count: number }[];
}

/**
 * Get gift history statistics
 */
export async function getGiftStats(db: SQLite.SQLiteDatabase): Promise<GiftStats> {
  try {
    // Total gifts
    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM gift_history'
    );
    const totalGifts = totalResult?.count || 0;

    // Purchased gifts
    const purchasedResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM gift_history WHERE isPurchased = 1'
    );
    const purchasedGifts = purchasedResult?.count || 0;

    // Average price (only purchased gifts with price)
    const avgPriceResult = await db.getFirstAsync<{ avg: number }>(
      'SELECT AVG(price) as avg FROM gift_history WHERE isPurchased = 1 AND price IS NOT NULL'
    );
    const averagePrice = avgPriceResult?.avg || 0;

    // Total spent
    const totalSpentResult = await db.getFirstAsync<{ total: number }>(
      'SELECT SUM(price) as total FROM gift_history WHERE isPurchased = 1 AND price IS NOT NULL'
    );
    const totalSpent = totalSpentResult?.total || 0;

    // Average rating
    const avgRatingResult = await db.getFirstAsync<{ avg: number }>(
      'SELECT AVG(rating) as avg FROM gift_history WHERE rating IS NOT NULL'
    );
    const averageRating = avgRatingResult?.avg || 0;

    // Gifts by event (join with events table)
    const giftsByEventResults = await db.getAllAsync<{
      eventId: string;
      eventTitle: string;
      count: number;
    }>(
      `SELECT
        gh.eventId,
        e.title as eventTitle,
        COUNT(*) as count
      FROM gift_history gh
      JOIN events e ON gh.eventId = e.id
      WHERE e.isDeleted = 0
      GROUP BY gh.eventId, e.title
      ORDER BY count DESC
      LIMIT 10`
    );

    return {
      totalGifts,
      purchasedGifts,
      averagePrice,
      totalSpent,
      averageRating,
      giftsByEvent: giftsByEventResults || [],
    };
  } catch (error) {
    console.error('Error getting gift stats:', error);
    return {
      totalGifts: 0,
      purchasedGifts: 0,
      averagePrice: 0,
      totalSpent: 0,
      averageRating: 0,
      giftsByEvent: [],
    };
  }
}

// ==================== CHECKLIST STATISTICS ====================

export interface ChecklistStats {
  totalChecklists: number;
  totalItems: number;
  completedItems: number;
  completionRate: number;
  fullyCompletedEvents: number;
  checklistsByEvent: {
    eventId: string;
    eventTitle: string;
    total: number;
    completed: number;
    completionRate: number;
  }[];
}

/**
 * Get checklist statistics
 */
export async function getChecklistStats(db: SQLite.SQLiteDatabase): Promise<ChecklistStats> {
  try {
    // Count events with checklists
    const checklistCountResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(DISTINCT eventId) as count
       FROM checklist_items`
    );
    const totalChecklists = checklistCountResult?.count || 0;

    // Total items
    const totalItemsResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM checklist_items'
    );
    const totalItems = totalItemsResult?.count || 0;

    // Completed items
    const completedItemsResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM checklist_items WHERE isCompleted = 1'
    );
    const completedItems = completedItemsResult?.count || 0;

    // Completion rate
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Fully completed events (all checklist items completed)
    const fullyCompletedResult = await db.getAllAsync<{ eventId: string }>(
      `SELECT eventId
       FROM checklist_items
       GROUP BY eventId
       HAVING COUNT(*) = SUM(isCompleted)`
    );
    const fullyCompletedEvents = fullyCompletedResult?.length || 0;

    // Checklists by event
    const checklistsByEventResults = await db.getAllAsync<{
      eventId: string;
      eventTitle: string;
      total: number;
      completed: number;
    }>(
      `SELECT
        ci.eventId,
        e.title as eventTitle,
        COUNT(*) as total,
        SUM(ci.isCompleted) as completed
      FROM checklist_items ci
      JOIN events e ON ci.eventId = e.id
      WHERE e.isDeleted = 0
      GROUP BY ci.eventId, e.title
      ORDER BY total DESC
      LIMIT 10`
    );

    const checklistsByEvent = checklistsByEventResults.map((item) => ({
      ...item,
      completionRate: item.total > 0 ? (item.completed / item.total) * 100 : 0,
    }));

    return {
      totalChecklists,
      totalItems,
      completedItems,
      completionRate,
      fullyCompletedEvents,
      checklistsByEvent,
    };
  } catch (error) {
    console.error('Error getting checklist stats:', error);
    return {
      totalChecklists: 0,
      totalItems: 0,
      completedItems: 0,
      completionRate: 0,
      fullyCompletedEvents: 0,
      checklistsByEvent: [],
    };
  }
}

// ==================== NOTIFICATION STATISTICS ====================

export interface NotificationStats {
  totalScheduled: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  avgRetryCount: number;
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(db: SQLite.SQLiteDatabase): Promise<NotificationStats> {
  try {
    // Total scheduled
    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notification_logs'
    );
    const totalScheduled = totalResult?.count || 0;

    // Delivered
    const deliveredResult = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM notification_logs WHERE status = 'delivered'"
    );
    const totalDelivered = deliveredResult?.count || 0;

    // Failed
    const failedResult = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM notification_logs WHERE status = 'failed'"
    );
    const totalFailed = failedResult?.count || 0;

    // Delivery rate
    const deliveryRate = totalScheduled > 0 ? (totalDelivered / totalScheduled) * 100 : 0;

    // Average retry count
    const avgRetryResult = await db.getFirstAsync<{ avg: number }>(
      'SELECT AVG(retryCount) as avg FROM notification_logs'
    );
    const avgRetryCount = avgRetryResult?.avg || 0;

    return {
      totalScheduled,
      totalDelivered,
      totalFailed,
      deliveryRate,
      avgRetryCount,
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return {
      totalScheduled: 0,
      totalDelivered: 0,
      totalFailed: 0,
      deliveryRate: 0,
      avgRetryCount: 0,
    };
  }
}

// ==================== TRENDS & INSIGHTS ====================

export interface MonthlyTrend {
  month: string; // YYYY-MM
  eventCount: number;
  giftSpending: number;
}

/**
 * Get monthly trends for the past 12 months
 */
export async function getMonthlyTrends(db: SQLite.SQLiteDatabase): Promise<MonthlyTrend[]> {
  try {
    // Get last 12 months
    const now = new Date();
    const monthlyData: MonthlyTrend[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const startDate = `${monthStr}-01`;
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const endDateStr = `${monthStr}-${String(endDate.getDate()).padStart(2, '0')}`;

      // Event count for this month
      const eventCountResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM events
         WHERE isDeleted = 0
         AND eventDate >= ?
         AND eventDate <= ?`,
        [startDate, endDateStr + 'T23:59:59']
      );
      const eventCount = eventCountResult?.count || 0;

      // Gift spending for this month
      const spendingResult = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(gh.price) as total
         FROM gift_history gh
         JOIN events e ON gh.eventId = e.id
         WHERE gh.isPurchased = 1
         AND gh.price IS NOT NULL
         AND e.eventDate >= ?
         AND e.eventDate <= ?`,
        [startDate, endDateStr + 'T23:59:59']
      );
      const giftSpending = spendingResult?.total || 0;

      monthlyData.push({
        month: monthStr,
        eventCount,
        giftSpending,
      });
    }

    return monthlyData;
  } catch (error) {
    console.error('Error getting monthly trends:', error);
    return [];
  }
}

// ==================== COMBINED ANALYTICS ====================

export interface AnalyticsDashboard {
  events: EventStats;
  gifts: GiftStats;
  checklists: ChecklistStats;
  notifications: NotificationStats;
  trends: MonthlyTrend[];
}

/**
 * Get all analytics data for dashboard
 */
export async function getDashboardAnalytics(
  db: SQLite.SQLiteDatabase
): Promise<AnalyticsDashboard> {
  try {
    const [events, gifts, checklists, notifications, trends] = await Promise.all([
      getEventStats(db),
      getGiftStats(db),
      getChecklistStats(db),
      getNotificationStats(db),
      getMonthlyTrends(db),
    ]);

    return {
      events,
      gifts,
      checklists,
      notifications,
      trends,
    };
  } catch (error) {
    console.error('Error getting dashboard analytics:', error);
    throw error;
  }
}
