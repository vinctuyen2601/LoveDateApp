import * as SQLite from "expo-sqlite";
import {
  Event,
  DatabaseEvent,
  SyncMetadata,
  Article,
  DatabaseArticle,
  Survey,
  DatabaseSurvey,
  ActivitySuggestion,
  GiftSuggestion,
  ChecklistTemplate,
  BadgeDefinition,
  SubscriptionProduct,
  DatabaseError,
} from "../types";

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
        isNotificationEnabled INTEGER DEFAULT 1,
        localId TEXT,
        serverId TEXT,
        version INTEGER DEFAULT 0,
        needsSync INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add isNotificationEnabled column if it doesn't exist (migration)
    try {
      await db.execAsync(
        "ALTER TABLE events ADD COLUMN isNotificationEnabled INTEGER DEFAULT 1;"
      );
    } catch (error: any) {
      if (!error.message?.includes("duplicate column")) {
        console.warn("Error adding isNotificationEnabled column:", error);
      }
    }

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
      await db.execAsync("ALTER TABLE events ADD COLUMN tags TEXT;");
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
        status TEXT DEFAULT 'published',
        imageUrl TEXT,
        author TEXT,
        readTime INTEGER,
        tags TEXT,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        isFeatured INTEGER DEFAULT 0,
        publishedAt TEXT,
        version INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrate existing articles table: add status column if missing (replaces isPublished)
    try {
      await db.execAsync(
        `ALTER TABLE articles ADD COLUMN status TEXT DEFAULT 'published';`
      );
      await db.execAsync(
        `UPDATE articles SET status = CASE WHEN isPublished = 1 THEN 'published' ELSE 'draft' END WHERE status IS NULL;`
      );
    } catch {
      // Column already exists — skip
    }
    try {
      await db.execAsync(`ALTER TABLE articles ADD COLUMN publishedAt TEXT;`);
    } catch {
      // Column already exists — skip
    }

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

    // Checklist items table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS checklist_items (
        id TEXT PRIMARY KEY,
        eventId TEXT NOT NULL,
        title TEXT NOT NULL,
        isCompleted INTEGER DEFAULT 0,
        dueDaysBefore INTEGER DEFAULT 0,
        displayOrder INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
      );
    `);

    // Index for checklist items
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_checklist_eventId ON checklist_items(eventId);
      CREATE INDEX IF NOT EXISTS idx_checklist_order ON checklist_items(eventId, displayOrder);
    `);

    // Gift history table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS gift_history (
        id TEXT PRIMARY KEY,
        eventId TEXT NOT NULL,
        giftName TEXT NOT NULL,
        price REAL,
        rating INTEGER,
        purchaseUrl TEXT,
        notes TEXT,
        isPurchased INTEGER DEFAULT 0,
        purchasedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
      );
    `);

    // Index for gift history
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_gift_eventId ON gift_history(eventId);
      CREATE INDEX IF NOT EXISTS idx_gift_purchased ON gift_history(isPurchased);
    `);

    // Notification logs table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id TEXT PRIMARY KEY,
        eventId TEXT NOT NULL,
        notificationId TEXT,
        daysBefore INTEGER NOT NULL,
        scheduledAt TEXT NOT NULL,
        deliveredAt TEXT,
        status TEXT NOT NULL,
        errorMessage TEXT,
        retryCount INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
      );
    `);

    // Index for notification logs
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notif_eventId ON notification_logs(eventId);
      CREATE INDEX IF NOT EXISTS idx_notif_status ON notification_logs(status);
      CREATE INDEX IF NOT EXISTS idx_notif_scheduled ON notification_logs(scheduledAt);
    `);

    // Activity suggestions table (Phase 2 - Task 5)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS activity_suggestions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT,
        address TEXT,
        priceRange TEXT,
        rating REAL,
        bookingUrl TEXT,
        phoneNumber TEXT,
        imageUrl TEXT,
        description TEXT,
        tags TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Index for activity suggestions
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_activity_category ON activity_suggestions(category);
      CREATE INDEX IF NOT EXISTS idx_activity_location ON activity_suggestions(location);
      CREATE INDEX IF NOT EXISTS idx_activity_rating ON activity_suggestions(rating);
    `);

    // User stats table (Phase 3 - Task 7: Gamification)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        currentStreak INTEGER DEFAULT 0,
        longestStreak INTEGER DEFAULT 0,
        totalEventsCreated INTEGER DEFAULT 0,
        totalEventsCompleted INTEGER DEFAULT 0,
        totalChecklistsCompleted INTEGER DEFAULT 0,
        totalGiftsPurchased INTEGER DEFAULT 0,
        lastActivityDate TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Achievements table (Phase 3 - Task 7: Gamification)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        badgeType TEXT NOT NULL,
        badgeName TEXT NOT NULL,
        badgeDescription TEXT,
        earnedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        notified INTEGER DEFAULT 0
      );
    `);

    // Index for gamification tables
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_stats_userId ON user_stats(userId);
      CREATE INDEX IF NOT EXISTS idx_achievements_userId ON achievements(userId);
      CREATE INDEX IF NOT EXISTS idx_achievements_badgeType ON achievements(badgeType);
    `);

    // Premium subscriptions table (Phase 3 - Task 8: Premium Features)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS premium_subscriptions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL UNIQUE,
        subscriptionType TEXT NOT NULL,
        status TEXT NOT NULL,
        purchaseToken TEXT,
        productId TEXT NOT NULL,
        purchaseDate TEXT NOT NULL,
        expiryDate TEXT,
        autoRenew INTEGER DEFAULT 1,
        platform TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Index for premium subscriptions
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_premium_userId ON premium_subscriptions(userId);
      CREATE INDEX IF NOT EXISTS idx_premium_status ON premium_subscriptions(status);
    `);

    // Gift suggestions table (CMS content — separate from user gift_history)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS gift_suggestions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT,
        budget TEXT,
        occasion TEXT,
        personality TEXT,
        hobbies TEXT,
        loveLanguage TEXT,
        gender TEXT,
        relationshipStage TEXT,
        whyGreat TEXT,
        tips TEXT,
        relatedProducts TEXT,
        relatedArticles TEXT,
        status TEXT DEFAULT 'published',
        version INTEGER DEFAULT 0,
        deletedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_gift_sug_type ON gift_suggestions(type);
      CREATE INDEX IF NOT EXISTS idx_gift_sug_status ON gift_suggestions(status);
    `);

    // Checklist templates table (CMS content — separate from user checklist_items)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS checklist_templates (
        id TEXT PRIMARY KEY,
        eventCategory TEXT NOT NULL,
        items TEXT NOT NULL,
        relationshipSpecific TEXT,
        status TEXT DEFAULT 'published',
        version INTEGER DEFAULT 0,
        deletedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_checklist_template_category ON checklist_templates(eventCategory);
    `);

    // Badge definitions table (CMS content — separate from user achievements)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS badge_definitions (
        id TEXT PRIMARY KEY,
        badgeType TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        requirements TEXT NOT NULL,
        rewards TEXT,
        status TEXT DEFAULT 'published',
        version INTEGER DEFAULT 0,
        deletedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_badge_def_type ON badge_definitions(badgeType);
    `);

    // Subscription plans table (CMS content — separate from user premium_subscriptions)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id TEXT PRIMARY KEY,
        planType TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        currency TEXT NOT NULL,
        billingCycle TEXT,
        features TEXT NOT NULL,
        isPopular INTEGER DEFAULT 0,
        displayOrder INTEGER DEFAULT 0,
        status TEXT DEFAULT 'published',
        version INTEGER DEFAULT 0,
        deletedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_plan_type ON subscription_plans(planType);
      CREATE INDEX IF NOT EXISTS idx_plan_order ON subscription_plans(displayOrder);
    `);

    // Master data cache table (stores API-fetched master data for offline use)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS master_data_cache (
        type TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Article reads table — tracks articles user has opened (hide from suggestions for 120 days)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS article_reads (
        article_id TEXT PRIMARY KEY,
        read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_article_reads_read_at ON article_reads(read_at);
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
      : { remindDaysBefore: [1, 7], reminderTime: { hour: 9, minute: 0 } },
    isRecurring: Boolean(dbEvent.isRecurring),
    recurrencePattern: dbEvent.recurrencePattern
      ? JSON.parse(dbEvent.recurrencePattern)
      : undefined,
    isDeleted: Boolean(dbEvent.isDeleted),
    isNotificationEnabled: dbEvent.isNotificationEnabled !== undefined ? Boolean(dbEvent.isNotificationEnabled) : true,
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
  if (event.isNotificationEnabled !== undefined)
    dbEvent.isNotificationEnabled = event.isNotificationEnabled ? 1 : 0;
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
        isNotificationEnabled INTEGER DEFAULT 1,
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
  async markEventSynced(localId: string, serverId: string) {
    if (!this.db) return;
    try {
      const now = new Date().toISOString();
      await this.db.runAsync(
        `UPDATE events SET serverId = ?, needsSync = 0, updatedAt = ?
         WHERE localId = ? OR id = ?`,
        [serverId, now, localId, localId]
      );
    } catch (error) {
      console.error("Error marking event as synced:", error);
    }
  }

  async getAllArticles(includeUnpublished = false): Promise<Article[]> {
    if (!this.db) return [];
    try {
      const query = includeUnpublished
        ? "SELECT * FROM articles ORDER BY updatedAt DESC"
        : "SELECT * FROM articles WHERE status = 'published' ORDER BY updatedAt DESC";
      const rows = (await this.db.getAllAsync(query)) as DatabaseArticle[];
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category as Article["category"],
        icon: row.icon,
        color: row.color,
        content: row.content,
        status: (row.status ?? "published") as Article["status"],
        imageUrl: row.imageUrl ?? undefined,
        author: row.author ?? undefined,
        readTime: row.readTime ?? undefined,
        tags: row.tags ? JSON.parse(row.tags) : [],
        likes: row.likes,
        views: row.views,
        isFeatured: Boolean(row.isFeatured),
        publishedAt: row.publishedAt ?? undefined,
        version: row.version,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error) {
      console.error("Error getting articles:", error);
      return [];
    }
  }

  async getAllSurveys(): Promise<Survey[]> {
    if (!this.db) return [];
    try {
      const rows = (await this.db.getAllAsync(
        "SELECT * FROM surveys WHERE status = 'published' ORDER BY updatedAt DESC"
      )) as DatabaseSurvey[];
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description ?? undefined,
        type: row.type as Survey["type"],
        status: row.status as Survey["status"],
        icon: row.icon ?? undefined,
        color: row.color ?? undefined,
        questions: JSON.parse(row.questions),
        results: row.results ? JSON.parse(row.results) : undefined,
        totalTaken: row.totalTaken,
        isFeatured: Boolean(row.isFeatured),
        version: row.version,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error) {
      console.error("Error getting surveys:", error);
      return [];
    }
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

  async bulkUpsertArticles(articles: Article[]): Promise<void> {
    if (!this.db || articles.length === 0) return;
    try {
      await this.db.withTransactionAsync(async () => {
        for (const a of articles) {
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO articles
              (id, title, category, icon, color, content, status, imageUrl, author, readTime,
               tags, likes, views, isFeatured, publishedAt, version, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              a.id,
              a.title,
              a.category,
              a.icon,
              a.color,
              a.content,
              a.status ?? "published",
              a.imageUrl ?? null,
              a.author ?? null,
              a.readTime ?? null,
              a.tags ? JSON.stringify(a.tags) : null,
              a.likes,
              a.views,
              a.isFeatured ? 1 : 0,
              a.publishedAt ?? null,
              a.version,
              a.createdAt,
              a.updatedAt,
            ]
          );
        }
      });
    } catch (error) {
      console.error("Error bulk saving articles:", error);
    }
  }

  async bulkUpsertSurveys(surveys: Survey[]): Promise<void> {
    if (!this.db || surveys.length === 0) return;
    try {
      await this.db.withTransactionAsync(async () => {
        for (const s of surveys) {
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO surveys
              (id, title, description, type, status, icon, color, questions, results,
               totalTaken, isFeatured, version, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              s.id,
              s.title,
              s.description ?? null,
              s.type,
              s.status,
              s.icon ?? null,
              s.color ?? null,
              JSON.stringify(s.questions),
              s.results ? JSON.stringify(s.results) : null,
              s.totalTaken,
              s.isFeatured ? 1 : 0,
              s.version,
              s.createdAt,
              s.updatedAt,
            ]
          );
        }
      });
    } catch (error) {
      console.error("Error bulk saving surveys:", error);
    }
  }

  async bulkUpsertActivities(activities: ActivitySuggestion[]): Promise<void> {
    if (!this.db || activities.length === 0) return;
    try {
      await this.db.withTransactionAsync(async () => {
        for (const a of activities) {
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO activity_suggestions
              (id, name, category, location, address, priceRange, rating, bookingUrl,
               phoneNumber, imageUrl, description, tags, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              a.id,
              a.name,
              a.category,
              a.location ?? null,
              a.address ?? null,
              a.priceRange ?? null,
              a.rating ?? null,
              a.bookingUrl ?? null,
              a.phoneNumber ?? null,
              a.imageUrl ?? null,
              a.description ?? null,
              a.tags ? JSON.stringify(a.tags) : null,
              a.createdAt,
              a.updatedAt,
            ]
          );
        }
      });
    } catch (error) {
      console.error("Error bulk saving activities:", error);
    }
  }

  async bulkUpsertGiftSuggestions(gifts: GiftSuggestion[]): Promise<void> {
    if (!this.db || gifts.length === 0) return;
    try {
      await this.db.withTransactionAsync(async () => {
        for (const g of gifts) {
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO gift_suggestions
              (id, title, description, type, category, budget, occasion, personality,
               hobbies, loveLanguage, gender, relationshipStage, whyGreat, tips,
               relatedProducts, relatedArticles, status, version, deletedAt, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              g.id,
              g.title,
              g.description,
              g.type,
              g.category ? JSON.stringify(g.category) : null,
              g.budget ? JSON.stringify(g.budget) : null,
              g.occasion ? JSON.stringify(g.occasion) : null,
              g.personality ? JSON.stringify(g.personality) : null,
              g.hobbies ? JSON.stringify(g.hobbies) : null,
              g.loveLanguage ? JSON.stringify(g.loveLanguage) : null,
              g.gender ?? null,
              g.relationshipStage ? JSON.stringify(g.relationshipStage) : null,
              g.whyGreat ?? null,
              g.tips ? JSON.stringify(g.tips) : null,
              g.relatedProducts ? JSON.stringify(g.relatedProducts) : null,
              g.relatedArticles ? JSON.stringify(g.relatedArticles) : null,
              g.status ?? "published",
              g.version ?? 0,
              g.deletedAt ?? null,
              g.createdAt ?? new Date().toISOString(),
              g.updatedAt ?? new Date().toISOString(),
            ]
          );
        }
      });
    } catch (error) {
      console.error("Error bulk saving gift suggestions:", error);
    }
  }

  async bulkUpsertChecklistTemplates(
    templates: ChecklistTemplate[]
  ): Promise<void> {
    if (!this.db || templates.length === 0) return;
    try {
      await this.db.withTransactionAsync(async () => {
        for (const t of templates) {
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO checklist_templates
              (id, eventCategory, items, relationshipSpecific, status, version, deletedAt, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              t.id,
              t.eventCategory,
              JSON.stringify(t.items),
              t.relationshipSpecific
                ? JSON.stringify(t.relationshipSpecific)
                : null,
              t.status ?? "published",
              t.version ?? 0,
              t.deletedAt ?? null,
              t.createdAt ?? new Date().toISOString(),
              t.updatedAt ?? new Date().toISOString(),
            ]
          );
        }
      });
    } catch (error) {
      console.error("Error bulk saving checklist templates:", error);
    }
  }

  async bulkUpsertBadgeDefinitions(badges: BadgeDefinition[]): Promise<void> {
    if (!this.db || badges.length === 0) return;
    try {
      await this.db.withTransactionAsync(async () => {
        for (const b of badges) {
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO badge_definitions
              (id, badgeType, name, description, icon, color, requirements, rewards,
               status, version, deletedAt, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              b.id,
              b.badgeType,
              b.name,
              b.description,
              b.icon,
              b.color,
              JSON.stringify(b.requirements),
              b.rewards ? JSON.stringify(b.rewards) : null,
              b.status ?? "published",
              b.version ?? 0,
              b.deletedAt ?? null,
              b.createdAt ?? new Date().toISOString(),
              b.updatedAt ?? new Date().toISOString(),
            ]
          );
        }
      });
    } catch (error) {
      console.error("Error bulk saving badge definitions:", error);
    }
  }

  async bulkUpsertSubscriptionPlans(
    plans: SubscriptionProduct[]
  ): Promise<void> {
    if (!this.db || plans.length === 0) return;
    try {
      await this.db.withTransactionAsync(async () => {
        for (const p of plans) {
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO subscription_plans
              (id, planType, name, description, price, currency, billingCycle, features,
               isPopular, displayOrder, status, version, deletedAt, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id,
              p.planType,
              p.name,
              p.description ?? null,
              p.price,
              p.currency,
              p.billingCycle ?? null,
              JSON.stringify(p.features),
              p.isPopular ? 1 : 0,
              p.displayOrder ?? 0,
              p.status ?? "published",
              p.version ?? 0,
              p.deletedAt ?? null,
              p.createdAt ?? new Date().toISOString(),
              p.updatedAt ?? new Date().toISOString(),
            ]
          );
        }
      });
    } catch (error) {
      console.error("Error bulk saving subscription plans:", error);
    }
  }

  async markArticleRead(articleId: string): Promise<void> {
    if (!this.db) return;
    return markArticleRead(this.db, articleId);
  }

  async getReadArticleIds(days = 120): Promise<string[]> {
    if (!this.db) return [];
    return getReadArticleIds(this.db, days);
  }

  async getUnsyncedReadArticleIds(): Promise<string[]> {
    if (!this.db) return [];
    return getUnsyncedReadArticleIds(this.db);
  }

  async markArticleReadsAsSynced(articleIds: string[]): Promise<void> {
    if (!this.db || articleIds.length === 0) return;
    return markArticleReadsAsSynced(this.db, articleIds);
  }

  async mergeServerArticleReads(articleIds: string[]): Promise<void> {
    if (!this.db || articleIds.length === 0) return;
    return mergeServerArticleReads(this.db, articleIds);
  }
}

// Export singleton instance for backward compatibility
export const databaseService = LegacyDatabaseService.getInstance();

// ─── Master data cache helpers ────────────────────────────────────────────────

export async function saveMasterDataCache(
  db: SQLite.SQLiteDatabase,
  type: string,
  data: unknown[]
): Promise<void> {
  await db.runAsync(
    `INSERT INTO master_data_cache (type, data, updatedAt)
     VALUES (?, ?, ?)
     ON CONFLICT(type) DO UPDATE SET data = excluded.data, updatedAt = excluded.updatedAt`,
    [type, JSON.stringify(data), new Date().toISOString()]
  );
}

export async function loadMasterDataCache<T>(
  db: SQLite.SQLiteDatabase,
  type: string
): Promise<T[] | null> {
  const row = await db.getFirstAsync<{ data: string }>(
    `SELECT data FROM master_data_cache WHERE type = ?`,
    [type]
  );
  if (!row) return null;
  try {
    return JSON.parse(row.data) as T[];
  } catch {
    return null;
  }
}

// ─── Article reads helpers ─────────────────────────────────────────────────────

/** Mark an article as read locally. Call when user opens an article. */
export async function markArticleRead(
  db: SQLite.SQLiteDatabase,
  articleId: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO article_reads (article_id, read_at, synced)
     VALUES (?, ?, 0)
     ON CONFLICT(article_id) DO UPDATE SET read_at = excluded.read_at, synced = 0`,
    [articleId, new Date().toISOString()]
  );
}

/** Get article IDs read within the last N days (default 120). */
export async function getReadArticleIds(
  db: SQLite.SQLiteDatabase,
  days = 120
): Promise<string[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const rows = await db.getAllAsync<{ article_id: string }>(
    `SELECT article_id FROM article_reads WHERE read_at > ?`,
    [cutoff.toISOString()]
  );
  return rows.map((r) => r.article_id);
}

/** Get article IDs that haven't been synced to server yet. */
export async function getUnsyncedReadArticleIds(
  db: SQLite.SQLiteDatabase
): Promise<string[]> {
  const rows = await db.getAllAsync<{ article_id: string }>(
    `SELECT article_id FROM article_reads WHERE synced = 0`
  );
  return rows.map((r) => r.article_id);
}

/** Mark article reads as synced after successful server sync. */
export async function markArticleReadsAsSynced(
  db: SQLite.SQLiteDatabase,
  articleIds: string[]
): Promise<void> {
  if (articleIds.length === 0) return;
  const placeholders = articleIds.map(() => '?').join(', ');
  await db.runAsync(
    `UPDATE article_reads SET synced = 1 WHERE article_id IN (${placeholders})`,
    articleIds
  );
}

/** Merge article reads received from server (other devices) into local DB. */
export async function mergeServerArticleReads(
  db: SQLite.SQLiteDatabase,
  articleIds: string[]
): Promise<void> {
  if (articleIds.length === 0) return;
  const now = new Date().toISOString();
  for (const id of articleIds) {
    await db.runAsync(
      `INSERT INTO article_reads (article_id, read_at, synced)
       VALUES (?, ?, 1)
       ON CONFLICT(article_id) DO NOTHING`,
      [id, now]
    );
  }
}
