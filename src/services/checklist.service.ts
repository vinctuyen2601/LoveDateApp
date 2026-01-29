import * as SQLite from "expo-sqlite";
import { ChecklistItem, DatabaseChecklistItem } from "../types";
import { DatabaseError } from "../types";
import { generateSmartChecklist } from "../data/checklistTemplates";

/**
 * Checklist Service - Manage checklist items for events
 */

/**
 * Convert DatabaseChecklistItem to ChecklistItem
 */
function dbChecklistToChecklist(
  dbItem: DatabaseChecklistItem
): ChecklistItem {
  return {
    id: dbItem.id,
    eventId: dbItem.eventId,
    title: dbItem.title,
    isCompleted: Boolean(dbItem.isCompleted),
    dueDaysBefore: dbItem.dueDaysBefore,
    displayOrder: dbItem.displayOrder,
    createdAt: dbItem.createdAt,
    updatedAt: dbItem.updatedAt,
  };
}

/**
 * Generate unique ID for checklist item
 */
function generateChecklistId(): string {
  return `checklist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all checklist items for an event
 */
export async function getChecklistItems(
  db: SQLite.SQLiteDatabase,
  eventId: string
): Promise<ChecklistItem[]> {
  try {
    const result = await db.getAllAsync<DatabaseChecklistItem>(
      `SELECT * FROM checklist_items
       WHERE eventId = ?
       ORDER BY displayOrder ASC, createdAt ASC`,
      [eventId]
    );

    return result.map(dbChecklistToChecklist);
  } catch (error) {
    console.error("Error getting checklist items:", error);
    throw new DatabaseError("Failed to get checklist items", error);
  }
}

/**
 * Create a new checklist item
 */
export async function createChecklistItem(
  db: SQLite.SQLiteDatabase,
  eventId: string,
  title: string,
  dueDaysBefore: number = 0,
  displayOrder?: number
): Promise<ChecklistItem> {
  try {
    const id = generateChecklistId();
    const now = new Date().toISOString();

    // If no display order provided, get the max order + 1
    let order = displayOrder;
    if (order === undefined) {
      const result = await db.getFirstAsync<{ maxOrder: number }>(
        `SELECT COALESCE(MAX(displayOrder), 0) as maxOrder
         FROM checklist_items
         WHERE eventId = ?`,
        [eventId]
      );
      order = (result?.maxOrder ?? 0) + 1;
    }

    await db.runAsync(
      `INSERT INTO checklist_items
       (id, eventId, title, isCompleted, dueDaysBefore, displayOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?)`,
      [id, eventId, title, dueDaysBefore, order, now, now]
    );

    return {
      id,
      eventId,
      title,
      isCompleted: false,
      dueDaysBefore,
      displayOrder: order,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Error creating checklist item:", error);
    throw new DatabaseError("Failed to create checklist item", error);
  }
}

/**
 * Update checklist item
 */
export async function updateChecklistItem(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: Partial<ChecklistItem>
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push("title = ?");
      values.push(updates.title);
    }

    if (updates.isCompleted !== undefined) {
      fields.push("isCompleted = ?");
      values.push(updates.isCompleted ? 1 : 0);
    }

    if (updates.dueDaysBefore !== undefined) {
      fields.push("dueDaysBefore = ?");
      values.push(updates.dueDaysBefore);
    }

    if (updates.displayOrder !== undefined) {
      fields.push("displayOrder = ?");
      values.push(updates.displayOrder);
    }

    if (fields.length === 0) {
      return; // No updates
    }

    fields.push("updatedAt = ?");
    values.push(now);
    values.push(id);

    await db.runAsync(
      `UPDATE checklist_items SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
  } catch (error) {
    console.error("Error updating checklist item:", error);
    throw new DatabaseError("Failed to update checklist item", error);
  }
}

/**
 * Toggle checklist item completion status
 */
export async function toggleChecklistItem(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<void> {
  try {
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE checklist_items
       SET isCompleted = NOT isCompleted,
           updatedAt = ?
       WHERE id = ?`,
      [now, id]
    );
  } catch (error) {
    console.error("Error toggling checklist item:", error);
    throw new DatabaseError("Failed to toggle checklist item", error);
  }
}

/**
 * Delete checklist item
 */
export async function deleteChecklistItem(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<void> {
  try {
    await db.runAsync("DELETE FROM checklist_items WHERE id = ?", [id]);
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    throw new DatabaseError("Failed to delete checklist item", error);
  }
}

/**
 * Delete all checklist items for an event
 */
export async function deleteChecklistItemsForEvent(
  db: SQLite.SQLiteDatabase,
  eventId: string
): Promise<void> {
  try {
    await db.runAsync("DELETE FROM checklist_items WHERE eventId = ?", [
      eventId,
    ]);
  } catch (error) {
    console.error("Error deleting checklist items for event:", error);
    throw new DatabaseError("Failed to delete checklist items for event", error);
  }
}

/**
 * Auto-generate checklist for an event based on its tags
 */
export async function generateChecklistForEvent(
  db: SQLite.SQLiteDatabase,
  eventId: string,
  eventTitle: string,
  eventTags: string[]
): Promise<ChecklistItem[]> {
  try {
    // Get template based on tags
    const template = generateSmartChecklist(eventTitle, eventTags);

    // Check if checklist already exists
    const existing = await getChecklistItems(db, eventId);
    if (existing.length > 0) {
      console.log("Checklist already exists for event:", eventId);
      return existing;
    }

    // Create checklist items from template
    const items: ChecklistItem[] = [];
    for (const templateItem of template) {
      const item = await createChecklistItem(
        db,
        eventId,
        templateItem.title,
        templateItem.dueDaysBefore,
        templateItem.order
      );
      items.push(item);
    }

    console.log(`Generated ${items.length} checklist items for event:`, eventId);
    return items;
  } catch (error) {
    console.error("Error generating checklist for event:", error);
    throw new DatabaseError("Failed to generate checklist for event", error);
  }
}

/**
 * Get checklist completion progress
 */
export async function getChecklistProgress(
  db: SQLite.SQLiteDatabase,
  eventId: string
): Promise<{ completed: number; total: number; percentage: number }> {
  try {
    const result = await db.getFirstAsync<{
      total: number;
      completed: number;
    }>(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN isCompleted = 1 THEN 1 ELSE 0 END) as completed
       FROM checklist_items
       WHERE eventId = ?`,
      [eventId]
    );

    const total = result?.total ?? 0;
    const completed = result?.completed ?? 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  } catch (error) {
    console.error("Error getting checklist progress:", error);
    throw new DatabaseError("Failed to get checklist progress", error);
  }
}

/**
 * Reorder checklist items
 */
export async function reorderChecklistItems(
  db: SQLite.SQLiteDatabase,
  items: { id: string; displayOrder: number }[]
): Promise<void> {
  try {
    const now = new Date().toISOString();

    // Use transaction for atomic update
    await db.execAsync("BEGIN TRANSACTION");

    try {
      for (const item of items) {
        await db.runAsync(
          `UPDATE checklist_items
           SET displayOrder = ?, updatedAt = ?
           WHERE id = ?`,
          [item.displayOrder, now, item.id]
        );
      }

      await db.execAsync("COMMIT");
    } catch (error) {
      await db.execAsync("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error reordering checklist items:", error);
    throw new DatabaseError("Failed to reorder checklist items", error);
  }
}

/**
 * Get incomplete checklist items that are due soon
 */
export async function getUpcomingChecklistItems(
  db: SQLite.SQLiteDatabase,
  eventId: string,
  eventDate: string
): Promise<ChecklistItem[]> {
  try {
    const items = await getChecklistItems(db, eventId);
    const eventDateObj = new Date(eventDate);
    const now = new Date();

    // Filter items that are incomplete and due within their time window
    return items.filter((item) => {
      if (item.isCompleted) return false;

      const dueDate = new Date(eventDateObj);
      dueDate.setDate(dueDate.getDate() - item.dueDaysBefore);

      // Show if we're past the due date but event hasn't happened yet
      return now >= dueDate && now < eventDateObj;
    });
  } catch (error) {
    console.error("Error getting upcoming checklist items:", error);
    throw new DatabaseError("Failed to get upcoming checklist items", error);
  }
}
