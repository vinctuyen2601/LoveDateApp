import * as SQLite from "expo-sqlite";
import { NotificationLog, DatabaseNotificationLog, NotificationStatus } from "../types";
import { DatabaseError } from "../types";

/**
 * Notification Log Service - Track notification scheduling and delivery
 */

/**
 * Convert DatabaseNotificationLog to NotificationLog
 */
function dbNotificationLogToNotificationLog(
  dbLog: DatabaseNotificationLog
): NotificationLog {
  return {
    id: dbLog.id,
    eventId: dbLog.eventId,
    notificationId: dbLog.notificationId ?? undefined,
    daysBefore: dbLog.daysBefore,
    scheduledAt: dbLog.scheduledAt,
    deliveredAt: dbLog.deliveredAt ?? undefined,
    status: dbLog.status as NotificationStatus,
    errorMessage: dbLog.errorMessage ?? undefined,
    retryCount: dbLog.retryCount,
    createdAt: dbLog.createdAt,
    updatedAt: dbLog.updatedAt,
  };
}

/**
 * Generate unique ID for notification log
 */
function generateLogId(): string {
  return `notif_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log notification scheduling
 */
export async function logNotificationScheduled(
  db: SQLite.SQLiteDatabase,
  eventId: string,
  notificationId: string,
  daysBefore: number,
  scheduledAt: string
): Promise<NotificationLog> {
  try {
    const id = generateLogId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO notification_logs
       (id, eventId, notificationId, daysBefore, scheduledAt, status, retryCount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'scheduled', 0, ?, ?)`,
      [id, eventId, notificationId, daysBefore, scheduledAt, now, now]
    );

    return {
      id,
      eventId,
      notificationId,
      daysBefore,
      scheduledAt,
      status: "scheduled",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Error logging notification scheduled:", error);
    throw new DatabaseError("Failed to log notification scheduled", error);
  }
}

/**
 * Log notification scheduling failure
 */
export async function logNotificationFailed(
  db: SQLite.SQLiteDatabase,
  eventId: string,
  daysBefore: number,
  scheduledAt: string,
  errorMessage: string
): Promise<NotificationLog> {
  try {
    const id = generateLogId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO notification_logs
       (id, eventId, daysBefore, scheduledAt, status, errorMessage, retryCount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'failed', ?, 0, ?, ?)`,
      [id, eventId, daysBefore, scheduledAt, errorMessage, now, now]
    );

    return {
      id,
      eventId,
      daysBefore,
      scheduledAt,
      status: "failed",
      errorMessage,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Error logging notification failed:", error);
    throw new DatabaseError("Failed to log notification failed", error);
  }
}

/**
 * Mark notification as delivered
 */
export async function markNotificationDelivered(
  db: SQLite.SQLiteDatabase,
  notificationId: string
): Promise<void> {
  try {
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE notification_logs
       SET status = 'delivered',
           deliveredAt = ?,
           updatedAt = ?
       WHERE notificationId = ?`,
      [now, now, notificationId]
    );
  } catch (error) {
    console.error("Error marking notification delivered:", error);
    throw new DatabaseError("Failed to mark notification delivered", error);
  }
}

/**
 * Mark notification as cancelled
 */
export async function markNotificationCancelled(
  db: SQLite.SQLiteDatabase,
  notificationId: string
): Promise<void> {
  try {
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE notification_logs
       SET status = 'cancelled',
           updatedAt = ?
       WHERE notificationId = ?`,
      [now, notificationId]
    );
  } catch (error) {
    console.error("Error marking notification cancelled:", error);
    throw new DatabaseError("Failed to mark notification cancelled", error);
  }
}

/**
 * Increment retry count
 */
export async function incrementRetryCount(
  db: SQLite.SQLiteDatabase,
  logId: string
): Promise<void> {
  try {
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE notification_logs
       SET retryCount = retryCount + 1,
           updatedAt = ?
       WHERE id = ?`,
      [now, logId]
    );
  } catch (error) {
    console.error("Error incrementing retry count:", error);
    throw new DatabaseError("Failed to increment retry count", error);
  }
}

/**
 * Get notification logs for an event
 */
export async function getEventNotificationLogs(
  db: SQLite.SQLiteDatabase,
  eventId: string
): Promise<NotificationLog[]> {
  try {
    const result = await db.getAllAsync<DatabaseNotificationLog>(
      `SELECT * FROM notification_logs
       WHERE eventId = ?
       ORDER BY scheduledAt DESC`,
      [eventId]
    );

    return result.map(dbNotificationLogToNotificationLog);
  } catch (error) {
    console.error("Error getting event notification logs:", error);
    throw new DatabaseError("Failed to get event notification logs", error);
  }
}

/**
 * Get all notification logs
 */
export async function getAllNotificationLogs(
  db: SQLite.SQLiteDatabase,
  limit: number = 100
): Promise<NotificationLog[]> {
  try {
    const result = await db.getAllAsync<DatabaseNotificationLog>(
      `SELECT * FROM notification_logs
       ORDER BY createdAt DESC
       LIMIT ?`,
      [limit]
    );

    return result.map(dbNotificationLogToNotificationLog);
  } catch (error) {
    console.error("Error getting all notification logs:", error);
    throw new DatabaseError("Failed to get all notification logs", error);
  }
}

/**
 * Get failed notifications
 */
export async function getFailedNotifications(
  db: SQLite.SQLiteDatabase
): Promise<NotificationLog[]> {
  try {
    const result = await db.getAllAsync<DatabaseNotificationLog>(
      `SELECT * FROM notification_logs
       WHERE status = 'failed'
       ORDER BY createdAt DESC`,
      []
    );

    return result.map(dbNotificationLogToNotificationLog);
  } catch (error) {
    console.error("Error getting failed notifications:", error);
    throw new DatabaseError("Failed to get failed notifications", error);
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(
  db: SQLite.SQLiteDatabase
): Promise<{
  total: number;
  scheduled: number;
  delivered: number;
  failed: number;
  cancelled: number;
  successRate: number;
}> {
  try {
    const result = await db.getFirstAsync<{
      total: number;
      scheduled: number;
      delivered: number;
      failed: number;
      cancelled: number;
    }>(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
       FROM notification_logs`,
      []
    );

    const total = result?.total ?? 0;
    const delivered = result?.delivered ?? 0;
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return {
      total,
      scheduled: result?.scheduled ?? 0,
      delivered,
      failed: result?.failed ?? 0,
      cancelled: result?.cancelled ?? 0,
      successRate,
    };
  } catch (error) {
    console.error("Error getting notification stats:", error);
    throw new DatabaseError("Failed to get notification stats", error);
  }
}

/**
 * Mark expired notifications (scheduled but past scheduled time)
 */
export async function markExpiredNotifications(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  try {
    const now = new Date().toISOString();

    const result = await db.runAsync(
      `UPDATE notification_logs
       SET status = 'expired',
           updatedAt = ?
       WHERE status = 'scheduled'
         AND scheduledAt < ?`,
      [now, now]
    );

    return result.changes;
  } catch (error) {
    console.error("Error marking expired notifications:", error);
    throw new DatabaseError("Failed to mark expired notifications", error);
  }
}

/**
 * Delete notification logs for an event
 */
export async function deleteEventNotificationLogs(
  db: SQLite.SQLiteDatabase,
  eventId: string
): Promise<void> {
  try {
    await db.runAsync("DELETE FROM notification_logs WHERE eventId = ?", [
      eventId,
    ]);
  } catch (error) {
    console.error("Error deleting event notification logs:", error);
    throw new DatabaseError("Failed to delete event notification logs", error);
  }
}

/**
 * Clean up old notification logs (keep last 90 days)
 */
export async function cleanupOldLogs(
  db: SQLite.SQLiteDatabase,
  daysToKeep: number = 90
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffISO = cutoffDate.toISOString();

    const result = await db.runAsync(
      `DELETE FROM notification_logs
       WHERE createdAt < ?`,
      [cutoffISO]
    );

    return result.changes;
  } catch (error) {
    console.error("Error cleaning up old logs:", error);
    throw new DatabaseError("Failed to cleanup old logs", error);
  }
}
