import * as SQLite from "expo-sqlite";
import {
  Event,
  DatabaseEvent,
  SyncMetadata,
  Article,
  DatabaseArticle,
  Survey,
  DatabaseSurvey,
} from "../types";
import { DatabaseError } from "../types";

const DB_NAME = "important_dates.db";

/**
 * Database helper functions that work with SQLite database instance
 * These functions are designed to be used with useSQLiteContext hook
 */

/**
 * Initialize database tables and run migrations
 */
export async function initializeTables(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  try {
    console.log("🔧 Initializing database tables...");

    // Events table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        eventDate TEXT NOT NULL,
        isLunarCalendar INTEGER DEFAULT 0,
        tags TEXT,
        reminderSettings TEXT,
        isRecurring INTEGER DEFAULT 1,
        recurrencePattern TEXT,
        isDeleted INTEGER DEFAULT 0,
        localId TEXT,
        serverId TEXT,
        version INTEGER DEFAULT 0,
        needsSync INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add recurrencePattern column if it doesn't exist (migration)
    try {
      await db.execAsync(
        "ALTER TABLE events ADD COLUMN recurrencePattern TEXT;"
      );
      console.log("Added recurrencePattern column to events table");
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message?.includes("duplicate column")) {
        console.warn("Error adding recurrencePattern column:", error);
      }
    }

    // Add tags column if it doesn't exist (migration)
    try {
      await db.execAsync(
        "ALTER TABLE events ADD COLUMN tags TEXT;"
      );
      console.log("Added tags column to events table");
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message?.includes("duplicate column")) {
        console.warn("Error adding tags column:", error);
      }
    }

    console.log("✅ Database schema initialized with tags support");

    // Indexes
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_eventDate ON events(eventDate);
      CREATE INDEX IF NOT EXISTS idx_needsSync ON events(needsSync);
      CREATE INDEX IF NOT EXISTS idx_isDeleted ON events(isDeleted);
    `);

    // Sync metadata table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Articles table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        content TEXT NOT NULL,
        imageUrl TEXT,
        author TEXT,
        readTime INTEGER,
        tags TEXT,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        isPublished INTEGER DEFAULT 1,
        isFeatured INTEGER DEFAULT 0,
        version INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Surveys table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS surveys (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'published',
        icon TEXT,
        color TEXT,
        questions TEXT NOT NULL,
        results TEXT,
        totalTaken INTEGER DEFAULT 0,
        isFeatured INTEGER DEFAULT 0,
        version INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Scheduled notifications table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS scheduled_notifications (
        id TEXT PRIMARY KEY,
        eventId TEXT NOT NULL,
        notificationId TEXT NOT NULL,
        daysBefore INTEGER NOT NULL,
        scheduledAt TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
      );
    `);

    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing tables:", error);
    throw new DatabaseError("Failed to initialize database tables", error);
  }
}

/**
 * Convert DatabaseEvent to Event
 */
function dbEventToEvent(dbEvent: DatabaseEvent): Event {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    eventDate: dbEvent.eventDate,
    isLunarCalendar: Boolean(dbEvent.isLunarCalendar),
    tags: dbEvent.tags ? JSON.parse(dbEvent.tags) : [],
    reminderSettings: dbEvent.reminderSettings
      ? JSON.parse(dbEvent.reminderSettings)
      : { remindDaysBefore: [] },
    isRecurring: Boolean(dbEvent.isRecurring),
    recurrencePattern: dbEvent.recurrencePattern
      ? JSON.parse(dbEvent.recurrencePattern)
      : undefined,
    isDeleted: Boolean(dbEvent.isDeleted),
    localId: dbEvent.localId || undefined,
    serverId: dbEvent.serverId || undefined,
    version: dbEvent.version,
    needsSync: Boolean(dbEvent.needsSync),
    createdAt: dbEvent.createdAt,
    updatedAt: dbEvent.updatedAt,
  };
}

/**
 * Convert Event to database format
 */
function eventToDbFormat(event: Partial<Event>): Partial<DatabaseEvent> {
  const dbEvent: Partial<DatabaseEvent> = {};

  if (event.id !== undefined) dbEvent.id = event.id;
  if (event.title !== undefined) dbEvent.title = event.title;
  if (event.eventDate !== undefined) dbEvent.eventDate = event.eventDate;
  if (event.isLunarCalendar !== undefined)
    dbEvent.isLunarCalendar = event.isLunarCalendar ? 1 : 0;
  if (event.tags !== undefined) dbEvent.tags = JSON.stringify(event.tags);
  if (event.reminderSettings !== undefined)
    dbEvent.reminderSettings = JSON.stringify(event.reminderSettings);
  if (event.isRecurring !== undefined)
    dbEvent.isRecurring = event.isRecurring ? 1 : 0;
  if (event.recurrencePattern !== undefined)
    dbEvent.recurrencePattern = event.recurrencePattern
      ? JSON.stringify(event.recurrencePattern)
      : null;
  if (event.isDeleted !== undefined)
    dbEvent.isDeleted = event.isDeleted ? 1 : 0;
  if (event.localId !== undefined) dbEvent.localId = event.localId || null;
  if (event.serverId !== undefined) dbEvent.serverId = event.serverId || null;
  if (event.version !== undefined) dbEvent.version = event.version;
  if (event.needsSync !== undefined)
    dbEvent.needsSync = event.needsSync ? 1 : 0;
  if (event.createdAt !== undefined) dbEvent.createdAt = event.createdAt;
  if (event.updatedAt !== undefined) dbEvent.updatedAt = event.updatedAt;

  return dbEvent;
}

/**
 * Create a new event
 */
export async function createEvent(
  db: SQLite.SQLiteDatabase,
  event: Omit<Event, "createdAt" | "updatedAt">
): Promise<Event> {
  try {
    const now = new Date().toISOString();
    const eventWithTimestamps: Event = {
      ...event,
      createdAt: now,
      updatedAt: now,
    };

    const dbEvent = eventToDbFormat(eventWithTimestamps);

    console.log(
      "Creating event with dbEvent:",
      JSON.stringify(dbEvent, null, 2)
    );

    // Validate required fields
    if (!dbEvent.id || !dbEvent.title || !dbEvent.eventDate) {
      throw new DatabaseError(
        `Missing required fields: id=${dbEvent.id}, title=${dbEvent.title}, eventDate=${dbEvent.eventDate}`
      );
    }

    // Use runAsync with prepared statement for better performance and safety
    await db.runAsync(
      `INSERT INTO events (
        id, title, eventDate, isLunarCalendar, tags,
        reminderSettings, isRecurring, recurrencePattern, isDeleted,
        localId, serverId, version, needsSync, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dbEvent.id,
        dbEvent.title,
        dbEvent.eventDate,
        dbEvent.isLunarCalendar ?? 0,
        dbEvent.tags ?? JSON.stringify([]),
        dbEvent.reminderSettings ?? null,
        dbEvent.isRecurring ?? 1,
        dbEvent.recurrencePattern ?? null,
        dbEvent.isDeleted ?? 0,
        dbEvent.localId ?? null,
        dbEvent.serverId ?? null,
        dbEvent.version ?? 0,
        dbEvent.needsSync ?? 1,
        now,
        now,
      ]
    );

    console.log("✅ Event created successfully!");
    return eventWithTimestamps;
  } catch (error) {
    console.error("Error creating event:", error);
    throw new DatabaseError("Failed to create event", error);
  }
}

/**
 * Get all events (excluding deleted)
 */
export async function getAllEvents(
  db: SQLite.SQLiteDatabase
): Promise<Event[]> {
  try {
    const result = await db.getAllAsync<DatabaseEvent>(
      "SELECT * FROM events WHERE isDeleted = 0 ORDER BY eventDate ASC"
    );
    return result.map((dbEvent) => dbEventToEvent(dbEvent));
  } catch (error) {
    console.error("Error getting all events:", error);
    throw new DatabaseError("Failed to get all events", error);
  }
}

/**
 * Get event by ID
 */
export async function getEventById(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<Event | null> {
  try {
    const result = await db.getFirstAsync<DatabaseEvent>(
      "SELECT * FROM events WHERE id = ? AND isDeleted = 0",
      [id]
    );
    return result ? dbEventToEvent(result) : null;
  } catch (error) {
    console.error("Error getting event by id:", error);
    throw new DatabaseError("Failed to get event by id", error);
  }
}

/**
 * Update an event
 */
export async function updateEvent(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: Partial<Event>
): Promise<Event> {
  try {
    const now = new Date().toISOString();
    const updatesWithTimestamp = { ...updates, updatedAt: now };
    const dbUpdates = eventToDbFormat(updatesWithTimestamp);

    // Build UPDATE query dynamically
    const fields = Object.keys(dbUpdates).filter((key) => key !== "id");
    if (fields.length === 0) {
      throw new DatabaseError("No fields to update");
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => (dbUpdates as any)[field]);

    await db.runAsync(
      `UPDATE events SET ${setClause}, version = version + 1, needsSync = 1 WHERE id = ?`,
      [...values, id]
    );

    // Fetch updated event
    const updatedEvent = await getEventById(db, id);
    if (!updatedEvent) {
      throw new DatabaseError("Event not found after update");
    }

    return updatedEvent;
  } catch (error) {
    console.error("Error updating event:", error);
    throw new DatabaseError("Failed to update event", error);
  }
}

/**
 * Soft delete an event
 */
export async function deleteEvent(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<void> {
  try {
    const now = new Date().toISOString();
    await db.runAsync(
      "UPDATE events SET isDeleted = 1, updatedAt = ?, version = version + 1, needsSync = 1 WHERE id = ?",
      [now, id]
    );
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new DatabaseError("Failed to delete event", error);
  }
}

/**
 * Search events by title
 */
export async function searchEvents(
  db: SQLite.SQLiteDatabase,
  query: string
): Promise<Event[]> {
  try {
    const searchPattern = `%${query}%`;
    const result = await db.getAllAsync<DatabaseEvent>(
      `SELECT * FROM events
       WHERE isDeleted = 0
       AND title LIKE ?
       ORDER BY eventDate ASC`,
      [searchPattern]
    );

    return result.map((dbEvent) => dbEventToEvent(dbEvent));
  } catch (error) {
    console.error("Error searching events:", error);
    throw new DatabaseError("Failed to search events", error);
  }
}

/**
 * Get events that need sync
 */
export async function getEventsNeedingSync(
  db: SQLite.SQLiteDatabase
): Promise<Event[]> {
  try {
    const result = await db.getAllAsync<DatabaseEvent>(
      "SELECT * FROM events WHERE needsSync = 1 ORDER BY updatedAt ASC"
    );
    return result.map((dbEvent) => dbEventToEvent(dbEvent));
  } catch (error) {
    console.error("Error getting events needing sync:", error);
    throw new DatabaseError("Failed to get events needing sync", error);
  }
}

/**
 * Reset database - drop all tables and recreate
 */
export async function resetDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    console.log("⚠️ Resetting database - all data will be deleted!");
    await db.execAsync("DROP TABLE IF EXISTS events");
    await db.execAsync("DROP TABLE IF EXISTS articles");
    await db.execAsync("DROP TABLE IF EXISTS surveys");
    await db.execAsync("DROP TABLE IF EXISTS sync_metadata");
    await db.execAsync("DROP TABLE IF EXISTS scheduled_notifications");
    await initializeTables(db);
    console.log("✅ Database reset complete!");
  } catch (error) {
    console.error("Error resetting database:", error);
    throw new DatabaseError("Failed to reset database", error);
  }
}

/**
 * Force recreate events table to fix corruption
 */
export async function forceRecreateEventsTable(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  try {
    console.log("🔧 Force recreating events table...");

    // Step 1: Cleanup
    await db.execAsync("DROP TABLE IF EXISTS events_old;");
    await db.execAsync("DROP TABLE IF EXISTS events_new;");

    // Step 2: Rename current events table
    await db.execAsync("ALTER TABLE events RENAME TO events_old;");
    console.log("✅ Renamed events to events_old");

    // Step 3: Create fresh events table with tags
    await db.execAsync(`
      CREATE TABLE events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        eventDate TEXT NOT NULL,
        isLunarCalendar INTEGER DEFAULT 0,
        tags TEXT,
        reminderSettings TEXT,
        isRecurring INTEGER DEFAULT 1,
        recurrencePattern TEXT,
        isDeleted INTEGER DEFAULT 0,
        localId TEXT,
        serverId TEXT,
        version INTEGER DEFAULT 0,
        needsSync INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Created fresh events table with tags");

    // Step 4: Copy data (if old table has tags column, copy it; otherwise set empty array)
    await db.execAsync(`
      INSERT INTO events
      (id, title, eventDate, isLunarCalendar, tags,
       reminderSettings, isRecurring, recurrencePattern, isDeleted,
       localId, serverId, version, needsSync, createdAt, updatedAt)
      SELECT
        id,
        title,
        eventDate,
        COALESCE(isLunarCalendar, 0),
        COALESCE(tags, '[]'),
        reminderSettings,
        COALESCE(isRecurring, 1),
        recurrencePattern,
        COALESCE(isDeleted, 0),
        localId,
        serverId,
        COALESCE(version, 0),
        COALESCE(needsSync, 0),
        COALESCE(createdAt, CURRENT_TIMESTAMP),
        COALESCE(updatedAt, CURRENT_TIMESTAMP)
      FROM events_old;
    `);
    console.log("✅ Copied data from old table");

    // Step 5: Drop old table
    await db.execAsync("DROP TABLE events_old;");
    console.log("✅ Dropped old table");

    // Step 6: Recreate indexes
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_eventDate ON events(eventDate);
      CREATE INDEX IF NOT EXISTS idx_needsSync ON events(needsSync);
      CREATE INDEX IF NOT EXISTS idx_isDeleted ON events(isDeleted);
    `);
    console.log("✅ Recreated indexes");

    console.log("✅ Force recreation completed successfully!");
  } catch (error) {
    console.error("❌ Force recreation failed:", error);
    // Try to restore
    try {
      await db.execAsync("DROP TABLE IF EXISTS events_new;");
      const tables = await db.getAllAsync<any>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='events_old'"
      );
      if (tables.length > 0) {
        await db.execAsync("ALTER TABLE events_old RENAME TO events;");
        console.log(
          "⚠️ Restored original events table after failed recreation"
        );
      }
    } catch (cleanupError) {
      console.error(
        "Failed to cleanup after recreation failure:",
        cleanupError
      );
    }
    throw new DatabaseError("Failed to force recreate events table", error);
  }
}

// Export database name for SQLiteProvider
export { DB_NAME };

/**
 * LEGACY COMPATIBILITY LAYER
 * This is a temporary singleton that provides backward compatibility
 * for files that haven't been migrated to use SQLiteProvider yet.
 *
 * DO NOT USE THIS IN NEW CODE - Use useSQLiteContext() instead!
 */
class LegacyDatabaseService {
  private static instance: LegacyDatabaseService;
  private db: any = null;

  private constructor() {}

  static getInstance(): LegacyDatabaseService {
    if (!LegacyDatabaseService.instance) {
      LegacyDatabaseService.instance = new LegacyDatabaseService();
    }
    return LegacyDatabaseService.instance;
  }

  // Set database instance (called from App.tsx)
  setDb(db: any) {
    this.db = db;
  }

  // Legacy methods that delegate to functional API
  async getAllEvents() {
    if (!this.db)
      throw new Error("Database not initialized. Use SQLiteProvider!");
    return getAllEvents(this.db);
  }

  async getEventById(id: string) {
    if (!this.db)
      throw new Error("Database not initialized. Use SQLiteProvider!");
    return getEventById(this.db, id);
  }

  async createEvent(event: any) {
    if (!this.db)
      throw new Error("Database not initialized. Use SQLiteProvider!");
    return createEvent(this.db, event);
  }

  async updateEvent(id: string, updates: any) {
    if (!this.db)
      throw new Error("Database not initialized. Use SQLiteProvider!");
    return updateEvent(this.db, id, updates);
  }

  async deleteEvent(id: string) {
    if (!this.db)
      throw new Error("Database not initialized. Use SQLiteProvider!");
    return deleteEvent(this.db, id);
  }

  async searchEvents(query: string) {
    if (!this.db)
      throw new Error("Database not initialized. Use SQLiteProvider!");
    return searchEvents(this.db, query);
  }

  async getEventsNeedingSync() {
    if (!this.db)
      throw new Error("Database not initialized. Use SQLiteProvider!");
    return getEventsNeedingSync(this.db);
  }

  // Additional methods for compatibility
  async markEventSynced(_localId: string, _serverId: string) {
    // Stub - syncing will be reimplemented later
    console.warn("markEventSynced called on legacy layer - not implemented");
  }

  async getAllArticles(_includeUnpublished?: boolean) {
    if (!this.db) return [];
    // Articles table exists, but we'll return empty for now
    return [];
  }

  async getAllSurveys() {
    if (!this.db) return [];
    return [];
  }

  async getSyncMetadata(key: string) {
    if (!this.db) return null;
    try {
      const result: any = await this.db.getFirstAsync(
        "SELECT value FROM sync_metadata WHERE key = ?",
        [key]
      );
      return result?.value || null;
    } catch {
      return null;
    }
  }

  async setSyncMetadata(key: string, value: string) {
    if (!this.db) return;
    try {
      await this.db.runAsync(
        "INSERT OR REPLACE INTO sync_metadata (key, value, updatedAt) VALUES (?, ?, ?)",
        [key, value, new Date().toISOString()]
      );
    } catch (error) {
      console.error("Error setting sync metadata:", error);
    }
  }

  async deleteScheduledNotifications(_eventId: string) {
    // Stub - notification tracking removed
  }

  async saveScheduledNotification(
    _eventId: string,
    _notificationId: string,
    _daysBefore: number,
    _scheduledAt: string
  ) {
    // Stub - notification tracking removed
  }

  async clearAllScheduledNotifications() {
    // Stub - notification tracking removed
  }

  async getAllScheduledNotificationIds() {
    // Stub - notification tracking removed
    return [];
  }

  async upsertArticle(_article: any) {
    // Stub - articles will be reimplemented later
    console.warn("upsertArticle called on legacy layer - not implemented");
  }

  async bulkUpsertArticles(_articles: any[]) {
    // Stub - articles will be reimplemented later
    console.warn("bulkUpsertArticles called on legacy layer - not implemented");
  }

  async bulkUpsertSurveys(_surveys: any[]) {
    // Stub - surveys will be reimplemented later
    console.warn("bulkUpsertSurveys called on legacy layer - not implemented");
  }
}

// Export singleton instance for backward compatibility
export const databaseService = LegacyDatabaseService.getInstance();
