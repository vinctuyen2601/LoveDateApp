import * as SQLite from "expo-sqlite";
import { GiftHistoryItem, DatabaseGiftHistoryItem } from "../types";
import { DatabaseError } from "../types";

/**
 * Gift History Service - Manage gift purchase history for events
 */

/**
 * Convert DatabaseGiftHistoryItem to GiftHistoryItem
 */
function dbGiftToGift(dbItem: DatabaseGiftHistoryItem): GiftHistoryItem {
  return {
    id: dbItem.id,
    eventId: dbItem.eventId,
    giftName: dbItem.giftName,
    price: dbItem.price ?? undefined,
    rating: dbItem.rating ?? undefined,
    purchaseUrl: dbItem.purchaseUrl ?? undefined,
    notes: dbItem.notes ?? undefined,
    isPurchased: Boolean(dbItem.isPurchased),
    purchasedAt: dbItem.purchasedAt ?? undefined,
    createdAt: dbItem.createdAt,
    updatedAt: dbItem.updatedAt,
  };
}

/**
 * Generate unique ID for gift history item
 */
function generateGiftId(): string {
  return `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all gift history items for an event
 */
export async function getGiftHistory(
  db: SQLite.SQLiteDatabase,
  eventId: string
): Promise<GiftHistoryItem[]> {
  try {
    const result = await db.getAllAsync<DatabaseGiftHistoryItem>(
      `SELECT * FROM gift_history
       WHERE eventId = ?
       ORDER BY createdAt DESC`,
      [eventId]
    );

    return result.map(dbGiftToGift);
  } catch (error) {
    console.error("Error getting gift history:", error);
    throw new DatabaseError("Failed to get gift history", error);
  }
}

/**
 * Get a single gift history item by ID
 */
export async function getGiftById(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<GiftHistoryItem | null> {
  try {
    const result = await db.getFirstAsync<DatabaseGiftHistoryItem>(
      `SELECT * FROM gift_history WHERE id = ?`,
      [id]
    );

    return result ? dbGiftToGift(result) : null;
  } catch (error) {
    console.error("Error getting gift by ID:", error);
    throw new DatabaseError("Failed to get gift by ID", error);
  }
}

/**
 * Create a new gift history item
 */
export async function createGiftItem(
  db: SQLite.SQLiteDatabase,
  eventId: string,
  giftName: string,
  options?: {
    price?: number;
    rating?: number;
    purchaseUrl?: string;
    notes?: string;
    isPurchased?: boolean;
  }
): Promise<GiftHistoryItem> {
  try {
    const id = generateGiftId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO gift_history
       (id, eventId, giftName, price, rating, purchaseUrl, notes, isPurchased, purchasedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eventId,
        giftName,
        options?.price ?? null,
        options?.rating ?? null,
        options?.purchaseUrl ?? null,
        options?.notes ?? null,
        options?.isPurchased ? 1 : 0,
        options?.isPurchased ? now : null,
        now,
        now,
      ]
    );

    return {
      id,
      eventId,
      giftName,
      price: options?.price,
      rating: options?.rating,
      purchaseUrl: options?.purchaseUrl,
      notes: options?.notes,
      isPurchased: options?.isPurchased ?? false,
      purchasedAt: options?.isPurchased ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Error creating gift item:", error);
    throw new DatabaseError("Failed to create gift item", error);
  }
}

/**
 * Update gift history item
 */
export async function updateGiftItem(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: Partial<GiftHistoryItem>
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.giftName !== undefined) {
      fields.push("giftName = ?");
      values.push(updates.giftName);
    }

    if (updates.price !== undefined) {
      fields.push("price = ?");
      values.push(updates.price);
    }

    if (updates.rating !== undefined) {
      fields.push("rating = ?");
      values.push(updates.rating);
    }

    if (updates.purchaseUrl !== undefined) {
      fields.push("purchaseUrl = ?");
      values.push(updates.purchaseUrl);
    }

    if (updates.notes !== undefined) {
      fields.push("notes = ?");
      values.push(updates.notes);
    }

    if (updates.isPurchased !== undefined) {
      fields.push("isPurchased = ?");
      values.push(updates.isPurchased ? 1 : 0);

      // If marking as purchased, set purchasedAt
      if (updates.isPurchased) {
        fields.push("purchasedAt = ?");
        values.push(now);
      } else {
        fields.push("purchasedAt = ?");
        values.push(null);
      }
    }

    if (fields.length === 0) {
      return; // No updates
    }

    fields.push("updatedAt = ?");
    values.push(now);
    values.push(id);

    await db.runAsync(
      `UPDATE gift_history SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
  } catch (error) {
    console.error("Error updating gift item:", error);
    throw new DatabaseError("Failed to update gift item", error);
  }
}

/**
 * Mark gift as purchased
 */
export async function markGiftAsPurchased(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<void> {
  try {
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE gift_history
       SET isPurchased = 1,
           purchasedAt = ?,
           updatedAt = ?
       WHERE id = ?`,
      [now, now, id]
    );
  } catch (error) {
    console.error("Error marking gift as purchased:", error);
    throw new DatabaseError("Failed to mark gift as purchased", error);
  }
}

/**
 * Delete gift history item
 */
export async function deleteGiftItem(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<void> {
  try {
    await db.runAsync("DELETE FROM gift_history WHERE id = ?", [id]);
  } catch (error) {
    console.error("Error deleting gift item:", error);
    throw new DatabaseError("Failed to delete gift item", error);
  }
}

/**
 * Delete all gift history for an event
 */
export async function deleteGiftHistoryForEvent(
  db: SQLite.SQLiteDatabase,
  eventId: string
): Promise<void> {
  try {
    await db.runAsync("DELETE FROM gift_history WHERE eventId = ?", [eventId]);
  } catch (error) {
    console.error("Error deleting gift history for event:", error);
    throw new DatabaseError("Failed to delete gift history for event", error);
  }
}

/**
 * Get gift statistics for an event
 */
export async function getGiftStats(
  db: SQLite.SQLiteDatabase,
  eventId: string
): Promise<{
  total: number;
  purchased: number;
  totalSpent: number;
  averageRating: number;
}> {
  try {
    const result = await db.getFirstAsync<{
      total: number;
      purchased: number;
      totalSpent: number;
      averageRating: number;
    }>(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN isPurchased = 1 THEN 1 ELSE 0 END) as purchased,
         COALESCE(SUM(CASE WHEN isPurchased = 1 THEN price ELSE 0 END), 0) as totalSpent,
         COALESCE(AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE NULL END), 0) as averageRating
       FROM gift_history
       WHERE eventId = ?`,
      [eventId]
    );

    return {
      total: result?.total ?? 0,
      purchased: result?.purchased ?? 0,
      totalSpent: result?.totalSpent ?? 0,
      averageRating: result?.averageRating ?? 0,
    };
  } catch (error) {
    console.error("Error getting gift stats:", error);
    throw new DatabaseError("Failed to get gift stats", error);
  }
}

/**
 * Get past successful gifts (purchased with rating >= 4)
 * Useful for AI context about what worked well
 */
export async function getPastSuccessfulGifts(
  db: SQLite.SQLiteDatabase,
  eventId: string
): Promise<GiftHistoryItem[]> {
  try {
    const result = await db.getAllAsync<DatabaseGiftHistoryItem>(
      `SELECT * FROM gift_history
       WHERE eventId = ?
         AND isPurchased = 1
         AND rating >= 4
       ORDER BY rating DESC, purchasedAt DESC
       LIMIT 10`,
      [eventId]
    );

    return result.map(dbGiftToGift);
  } catch (error) {
    console.error("Error getting past successful gifts:", error);
    throw new DatabaseError("Failed to get past successful gifts", error);
  }
}
