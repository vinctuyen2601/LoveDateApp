import * as SQLite from "expo-sqlite";
import {
  Event,
  DatabaseEvent,
  SyncMetadata,
  ReminderSettings,
  EventNote,
  Article,
  DatabaseArticle,
  Survey,
  DatabaseSurvey,
} from "../types";
import { DatabaseError } from "../types";

const DB_NAME = "important_dates.db";

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Initialize database connection
   */
  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Error initializing database:", error);
      throw new DatabaseError("Failed to initialize database", error);
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      // Events table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          eventDate TEXT NOT NULL,
          isLunarCalendar INTEGER DEFAULT 0,
          category TEXT DEFAULT 'other',
          relationshipType TEXT DEFAULT 'other',
          reminderSettings TEXT,
          giftIdeas TEXT,
          notes TEXT,
          isRecurring INTEGER DEFAULT 1,
          recurrencePattern TEXT,
          isDeleted INTEGER DEFAULT 0,
          localId TEXT,
          serverId TEXT,
          version INTEGER DEFAULT 0,
          needsSync INTEGER DEFAULT 0,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Migration: Add recurrencePattern column if it doesn't exist
      try {
        await this.db.execAsync(`
          ALTER TABLE events ADD COLUMN recurrencePattern TEXT;
        `);
        console.log("Added recurrencePattern column to events table");
      } catch (error: any) {
        // Column might already exist, ignore error
        if (!error.message?.includes("duplicate column")) {
          console.warn("Error adding recurrencePattern column:", error);
        }
      }

      // Indexes
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_eventDate ON events(eventDate);
        CREATE INDEX IF NOT EXISTS idx_needsSync ON events(needsSync);
        CREATE INDEX IF NOT EXISTS idx_category ON events(category);
        CREATE INDEX IF NOT EXISTS idx_isDeleted ON events(isDeleted);
      `);

      // Sync metadata table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
          key TEXT PRIMARY KEY,
          value TEXT,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Articles table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS articles (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
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

      // Indexes for articles
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_article_category ON articles(category);
        CREATE INDEX IF NOT EXISTS idx_article_published ON articles(isPublished);
        CREATE INDEX IF NOT EXISTS idx_article_featured ON articles(isFeatured);
        CREATE INDEX IF NOT EXISTS idx_article_version ON articles(version);
      `);

      // Surveys table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS surveys (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          status TEXT DEFAULT 'draft',
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

      // Indexes for surveys
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_survey_type ON surveys(type);
        CREATE INDEX IF NOT EXISTS idx_survey_status ON surveys(status);
        CREATE INDEX IF NOT EXISTS idx_survey_featured ON surveys(isFeatured);
        CREATE INDEX IF NOT EXISTS idx_survey_version ON surveys(version);
      `);

      // Scheduled notifications table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS scheduled_notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          eventId TEXT NOT NULL,
          notificationId TEXT NOT NULL,
          daysBefore INTEGER NOT NULL,
          scheduledAt TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
        );
      `);

      // Indexes for scheduled notifications
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_notification_eventId ON scheduled_notifications(eventId);
        CREATE INDEX IF NOT EXISTS idx_notification_id ON scheduled_notifications(notificationId);
      `);

      console.log("Database tables created successfully");
    } catch (error) {
      console.error("Error creating tables:", error);
      throw new DatabaseError("Failed to create tables", error);
    }
  }

  /**
   * Convert DatabaseEvent to Event
   */
  private dbEventToEvent(dbEvent: DatabaseEvent): Event {
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description || undefined,
      eventDate: dbEvent.eventDate,
      isLunarCalendar: Boolean(dbEvent.isLunarCalendar),
      category: dbEvent.category as any,
      relationshipType: dbEvent.relationshipType as any,
      reminderSettings: dbEvent.reminderSettings
        ? JSON.parse(dbEvent.reminderSettings)
        : { remindDaysBefore: [] },
      giftIdeas: dbEvent.giftIdeas ? JSON.parse(dbEvent.giftIdeas) : [],
      notes: dbEvent.notes ? JSON.parse(dbEvent.notes) : [],
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
  private eventToDbFormat(event: Partial<Event>): Partial<DatabaseEvent> {
    const dbEvent: Partial<DatabaseEvent> = {};

    if (event.id !== undefined) dbEvent.id = event.id;
    if (event.title !== undefined) dbEvent.title = event.title;
    if (event.description !== undefined)
      dbEvent.description = event.description || null;
    if (event.eventDate !== undefined) dbEvent.eventDate = event.eventDate;
    if (event.isLunarCalendar !== undefined)
      dbEvent.isLunarCalendar = event.isLunarCalendar ? 1 : 0;
    if (event.category !== undefined) dbEvent.category = event.category;
    if (event.relationshipType !== undefined)
      dbEvent.relationshipType = event.relationshipType;
    if (event.reminderSettings !== undefined)
      dbEvent.reminderSettings = JSON.stringify(event.reminderSettings);
    if (event.giftIdeas !== undefined)
      dbEvent.giftIdeas = JSON.stringify(event.giftIdeas);
    if (event.notes !== undefined) dbEvent.notes = JSON.stringify(event.notes);
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
  async createEvent(
    event: Omit<Event, "createdAt" | "updatedAt">
  ): Promise<Event> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const now = new Date().toISOString();
      const eventWithTimestamps: Event = {
        ...event,
        createdAt: now,
        updatedAt: now,
      };

      const dbEvent = this.eventToDbFormat(eventWithTimestamps);

      console.log("Creating event with dbEvent:", JSON.stringify(dbEvent, null, 2));

      // Validate required fields
      if (!dbEvent.id || !dbEvent.title || !dbEvent.eventDate) {
        throw new DatabaseError(
          `Missing required fields: id=${dbEvent.id}, title=${dbEvent.title}, eventDate=${dbEvent.eventDate}`
        );
      }

      // Build INSERT with proper null handling for Android SQLite
      const columns: string[] = [];
      const placeholders: string[] = [];
      const values: any[] = [];

      // Helper function to add field
      const addField = (columnName: string, value: any) => {
        columns.push(columnName);
        if (value === null || value === undefined) {
          placeholders.push('NULL');
        } else {
          placeholders.push('?');
          values.push(value);
        }
      };

      // Add all fields
      addField('id', dbEvent.id);
      addField('title', dbEvent.title);
      addField('description', dbEvent.description ?? null);
      addField('eventDate', dbEvent.eventDate);
      addField('isLunarCalendar', dbEvent.isLunarCalendar ?? 0);
      addField('category', dbEvent.category ?? 'other');
      addField('relationshipType', dbEvent.relationshipType ?? 'other');
      addField('reminderSettings', dbEvent.reminderSettings ?? null);
      addField('giftIdeas', dbEvent.giftIdeas ?? null);
      addField('notes', dbEvent.notes ?? null);
      addField('isRecurring', dbEvent.isRecurring ?? 1);
      addField('recurrencePattern', dbEvent.recurrencePattern ?? null);
      addField('isDeleted', dbEvent.isDeleted ?? 0);
      addField('localId', dbEvent.localId ?? null);
      addField('serverId', dbEvent.serverId ?? null);
      addField('version', dbEvent.version ?? 0);
      addField('needsSync', dbEvent.needsSync ?? 1);
      addField('createdAt', now);
      addField('updatedAt', now);

      const query = `INSERT INTO events (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;

      console.log("INSERT query:", query);
      console.log("INSERT values:", values);

      await this.db.runAsync(query, values);

      return eventWithTimestamps;
    } catch (error) {
      console.error("Error creating event:", error);
      throw new DatabaseError("Failed to create event", error);
    }
  }

  /**
   * Get all events (excluding deleted)
   */
  async getAllEvents(): Promise<Event[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getAllAsync<DatabaseEvent>(
        "SELECT * FROM events WHERE isDeleted = 0 ORDER BY eventDate ASC"
      );
      return result.map((dbEvent) => this.dbEventToEvent(dbEvent));
    } catch (error) {
      console.error("Error getting all events:", error);
      throw new DatabaseError("Failed to get all events", error);
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<Event | null> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getFirstAsync<DatabaseEvent>(
        "SELECT * FROM events WHERE id = ? AND isDeleted = 0",
        [id]
      );
      return result ? this.dbEventToEvent(result) : null;
    } catch (error) {
      console.error("Error getting event by id:", error);
      throw new DatabaseError("Failed to get event by id", error);
    }
  }

  /**
   * Update event
   */
  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const now = new Date().toISOString();
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: now,
        version: Date.now(),
        needsSync: true,
      };

      const dbUpdates = this.eventToDbFormat(updatesWithTimestamp);

      console.log(
        "dbUpdates before processing:",
        JSON.stringify(dbUpdates, null, 2)
      );
      console.log("dbUpdates keys:", Object.keys(dbUpdates));

      // Build dynamic UPDATE query - only include fields that are defined
      const setClauses: string[] = [];
      const values: any[] = [];

      Object.entries(dbUpdates).forEach(([key, value]) => {
        if (key !== "id" && value !== undefined) {
          // Handle null values differently - Android SQLite doesn't accept null in prepared statements
          if (value === null || value === "") {
            // For null values, use literal NULL in SQL instead of parameter binding
            setClauses.push(`${key} = NULL`);
            console.log(`Field "${key}" = NULL (literal)`);
          } else {
            // For non-null values, use parameter binding
            setClauses.push(`${key} = ?`);
            values.push(value);
            console.log(`Field "${key}" = ${typeof value === 'string' ? `"${value.substring(0, 50)}..."` : value}`);
          }
        }
      });

      if (setClauses.length === 0) {
        throw new DatabaseError("No fields to update");
      }

      const setClause = setClauses.join(", ");

      const fullQuery = `UPDATE events SET ${setClause} WHERE id = ?`;
      const fullValues = [...values, id];

      console.log("UPDATE query:", fullQuery);
      console.log("Values:", JSON.stringify(fullValues));
      console.log("Number of placeholders:", (fullQuery.match(/\?/g) || []).length);
      console.log("Number of values:", fullValues.length);
      console.log("Set clauses:", setClauses);

      // Validate that we have the right number of parameters
      const placeholderCount = (fullQuery.match(/\?/g) || []).length;
      if (placeholderCount !== fullValues.length) {
        throw new DatabaseError(
          `Parameter count mismatch: query has ${placeholderCount} placeholders but ${fullValues.length} values provided`
        );
      }

      try {
        await this.db.runAsync(fullQuery, fullValues);
      } catch (runError: any) {
        console.error("runAsync error details:", {
          message: runError.message,
          query: fullQuery,
          values: fullValues,
        });
        throw runError;
      }

      const updatedEvent = await this.getEventById(id);
      if (!updatedEvent) {
        console.log(222222);

        throw new DatabaseError("Event not found after update");
      }

      return updatedEvent;
    } catch (error) {
      console.error("Error updating event:", error);
      throw new DatabaseError("Failed to update event", error);
    }
  }

  /**
   * Delete event (soft delete)
   */
  async deleteEvent(id: string): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const now = new Date().toISOString();
      await this.db.runAsync(
        "UPDATE events SET isDeleted = 1, needsSync = 1, updatedAt = ?, version = ? WHERE id = ?",
        [now, Date.now(), id]
      );
    } catch (error) {
      console.error("Error deleting event:", error);
      throw new DatabaseError("Failed to delete event", error);
    }
  }

  /**
   * Permanently delete event
   */
  async permanentlyDeleteEvent(id: string): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.runAsync("DELETE FROM events WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error permanently deleting event:", error);
      throw new DatabaseError("Failed to permanently delete event", error);
    }
  }

  /**
   * Get events that need sync
   */
  async getEventsNeedingSync(): Promise<Event[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getAllAsync<DatabaseEvent>(
        "SELECT * FROM events WHERE needsSync = 1"
      );
      return result.map((dbEvent) => this.dbEventToEvent(dbEvent));
    } catch (error) {
      console.error("Error getting events needing sync:", error);
      throw new DatabaseError("Failed to get events needing sync", error);
    }
  }

  /**
   * Mark event as synced
   */
  async markEventSynced(localId: string, serverId: string): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.runAsync(
        "UPDATE events SET needsSync = 0, serverId = ? WHERE id = ?",
        [serverId, localId]
      );
    } catch (error) {
      console.error("Error marking event as synced:", error);
      throw new DatabaseError("Failed to mark event as synced", error);
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(days: number = 30): Promise<Event[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const result = await this.db.getAllAsync<DatabaseEvent>(
        `SELECT * FROM events
         WHERE isDeleted = 0
         AND eventDate >= ?
         AND eventDate <= ?
         ORDER BY eventDate ASC`,
        [now.toISOString(), futureDate.toISOString()]
      );

      return result.map((dbEvent) => this.dbEventToEvent(dbEvent));
    } catch (error) {
      console.error("Error getting upcoming events:", error);
      throw new DatabaseError("Failed to get upcoming events", error);
    }
  }

  /**
   * Search events
   */
  async searchEvents(query: string): Promise<Event[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const searchPattern = `%${query}%`;
      const result = await this.db.getAllAsync<DatabaseEvent>(
        `SELECT * FROM events
         WHERE isDeleted = 0
         AND (title LIKE ? OR description LIKE ?)
         ORDER BY eventDate ASC`,
        [searchPattern, searchPattern]
      );

      return result.map((dbEvent) => this.dbEventToEvent(dbEvent));
    } catch (error) {
      console.error("Error searching events:", error);
      throw new DatabaseError("Failed to search events", error);
    }
  }

  /**
   * Get events by category
   */
  async getEventsByCategory(category: string): Promise<Event[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getAllAsync<DatabaseEvent>(
        "SELECT * FROM events WHERE isDeleted = 0 AND category = ? ORDER BY eventDate ASC",
        [category]
      );

      return result.map((dbEvent) => this.dbEventToEvent(dbEvent));
    } catch (error) {
      console.error("Error getting events by category:", error);
      throw new DatabaseError("Failed to get events by category", error);
    }
  }

  /**
   * Get sync metadata
   */
  async getSyncMetadata(key: string): Promise<string | null> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getFirstAsync<SyncMetadata>(
        "SELECT * FROM sync_metadata WHERE key = ?",
        [key]
      );
      return result ? result.value : null;
    } catch (error) {
      console.error("Error getting sync metadata:", error);
      throw new DatabaseError("Failed to get sync metadata", error);
    }
  }

  /**
   * Set sync metadata
   */
  async setSyncMetadata(key: string, value: string): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const now = new Date().toISOString();
      await this.db.runAsync(
        `INSERT OR REPLACE INTO sync_metadata (key, value, updatedAt) VALUES (?, ?, ?)`,
        [key, value, now]
      );
    } catch (error) {
      console.error("Error setting sync metadata:", error);
      throw new DatabaseError("Failed to set sync metadata", error);
    }
  }

  /**
   * Clear all data (for logout or reset)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.execAsync("DELETE FROM events");
      await this.db.execAsync("DELETE FROM articles");
      await this.db.execAsync("DELETE FROM surveys");
      await this.db.execAsync("DELETE FROM sync_metadata");
      console.log("All data cleared successfully");
    } catch (error) {
      console.error("Error clearing all data:", error);
      throw new DatabaseError("Failed to clear all data", error);
    }
  }

  // ==================== ARTICLES METHODS ====================

  /**
   * Convert DatabaseArticle to Article
   */
  private dbArticleToArticle(dbArticle: DatabaseArticle): Article {
    return {
      id: dbArticle.id,
      title: dbArticle.title,
      category: dbArticle.category as any,
      icon: dbArticle.icon,
      color: dbArticle.color,
      content: dbArticle.content,
      imageUrl: dbArticle.imageUrl || undefined,
      author: dbArticle.author || undefined,
      readTime: dbArticle.readTime || undefined,
      tags: dbArticle.tags ? JSON.parse(dbArticle.tags) : undefined,
      likes: dbArticle.likes,
      views: dbArticle.views,
      isPublished: Boolean(dbArticle.isPublished),
      isFeatured: Boolean(dbArticle.isFeatured),
      version: dbArticle.version,
      createdAt: dbArticle.createdAt,
      updatedAt: dbArticle.updatedAt,
    };
  }

  /**
   * Get all articles (published only by default)
   */
  async getAllArticles(
    includeUnpublished: boolean = false
  ): Promise<Article[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const query = includeUnpublished
        ? "SELECT * FROM articles ORDER BY createdAt DESC"
        : "SELECT * FROM articles WHERE isPublished = 1 ORDER BY createdAt DESC";

      const result = await this.db.getAllAsync<DatabaseArticle>(query);
      return result.map((dbArticle) => this.dbArticleToArticle(dbArticle));
    } catch (error) {
      console.error("Error getting all articles:", error);
      throw new DatabaseError("Failed to get all articles", error);
    }
  }

  /**
   * Get article by ID
   */
  async getArticleById(id: string): Promise<Article | null> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getFirstAsync<DatabaseArticle>(
        "SELECT * FROM articles WHERE id = ?",
        [id]
      );
      return result ? this.dbArticleToArticle(result) : null;
    } catch (error) {
      console.error("Error getting article by id:", error);
      throw new DatabaseError("Failed to get article by id", error);
    }
  }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(category: string): Promise<Article[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getAllAsync<DatabaseArticle>(
        "SELECT * FROM articles WHERE category = ? AND isPublished = 1 ORDER BY createdAt DESC",
        [category]
      );
      return result.map((dbArticle) => this.dbArticleToArticle(dbArticle));
    } catch (error) {
      console.error("Error getting articles by category:", error);
      throw new DatabaseError("Failed to get articles by category", error);
    }
  }

  /**
   * Get featured articles
   */
  async getFeaturedArticles(): Promise<Article[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getAllAsync<DatabaseArticle>(
        "SELECT * FROM articles WHERE isFeatured = 1 AND isPublished = 1 ORDER BY createdAt DESC"
      );
      return result.map((dbArticle) => this.dbArticleToArticle(dbArticle));
    } catch (error) {
      console.error("Error getting featured articles:", error);
      throw new DatabaseError("Failed to get featured articles", error);
    }
  }

  /**
   * Upsert article (insert or replace if exists)
   */
  async upsertArticle(article: Article): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO articles (
          id, title, category, icon, color, content, imageUrl, author, readTime,
          tags, likes, views, isPublished, isFeatured, version, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          article.id,
          article.title,
          article.category,
          article.icon,
          article.color,
          article.content,
          article.imageUrl || null,
          article.author || null,
          article.readTime || null,
          article.tags ? JSON.stringify(article.tags) : null,
          article.likes,
          article.views,
          article.isPublished ? 1 : 0,
          article.isFeatured ? 1 : 0,
          article.version,
          article.createdAt,
          article.updatedAt,
        ]
      );
    } catch (error) {
      console.error("Error upserting article:", error);
      throw new DatabaseError("Failed to upsert article", error);
    }
  }

  /**
   * Bulk upsert articles (for sync)
   */
  async bulkUpsertArticles(articles: Article[]): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      for (const article of articles) {
        await this.upsertArticle(article);
      }
      console.log(`Bulk upserted ${articles.length} articles`);
    } catch (error) {
      console.error("Error bulk upserting articles:", error);
      throw new DatabaseError("Failed to bulk upsert articles", error);
    }
  }

  /**
   * Delete article by ID
   */
  async deleteArticle(id: string): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.runAsync("DELETE FROM articles WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error deleting article:", error);
      throw new DatabaseError("Failed to delete article", error);
    }
  }

  /**
   * Increment article view count
   */
  async incrementArticleViews(id: string): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.runAsync(
        "UPDATE articles SET views = views + 1 WHERE id = ?",
        [id]
      );
    } catch (error) {
      console.error("Error incrementing article views:", error);
      throw new DatabaseError("Failed to increment article views", error);
    }
  }

  // ==================== SURVEYS METHODS ====================

  /**
   * Convert DatabaseSurvey to Survey
   */
  private dbSurveyToSurvey(dbSurvey: DatabaseSurvey): Survey {
    return {
      id: dbSurvey.id,
      title: dbSurvey.title,
      description: dbSurvey.description || undefined,
      type: dbSurvey.type as any,
      status: dbSurvey.status as any,
      icon: dbSurvey.icon || undefined,
      color: dbSurvey.color || undefined,
      questions: JSON.parse(dbSurvey.questions),
      results: dbSurvey.results ? JSON.parse(dbSurvey.results) : undefined,
      totalTaken: dbSurvey.totalTaken,
      isFeatured: Boolean(dbSurvey.isFeatured),
      version: dbSurvey.version,
      createdAt: dbSurvey.createdAt,
      updatedAt: dbSurvey.updatedAt,
    };
  }

  /**
   * Get all surveys (published only by default)
   */
  async getAllSurveys(includeUnpublished: boolean = false): Promise<Survey[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const query = includeUnpublished
        ? "SELECT * FROM surveys ORDER BY createdAt DESC"
        : 'SELECT * FROM surveys WHERE status = "published" ORDER BY createdAt DESC';

      const result = await this.db.getAllAsync<DatabaseSurvey>(query);
      return result.map((dbSurvey) => this.dbSurveyToSurvey(dbSurvey));
    } catch (error) {
      console.error("Error getting all surveys:", error);
      throw new DatabaseError("Failed to get all surveys", error);
    }
  }

  /**
   * Get survey by ID
   */
  async getSurveyById(id: string): Promise<Survey | null> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getFirstAsync<DatabaseSurvey>(
        "SELECT * FROM surveys WHERE id = ?",
        [id]
      );
      return result ? this.dbSurveyToSurvey(result) : null;
    } catch (error) {
      console.error("Error getting survey by id:", error);
      throw new DatabaseError("Failed to get survey by id", error);
    }
  }

  /**
   * Get surveys by type
   */
  async getSurveysByType(type: string): Promise<Survey[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getAllAsync<DatabaseSurvey>(
        'SELECT * FROM surveys WHERE type = ? AND status = "published" ORDER BY createdAt DESC',
        [type]
      );
      return result.map((dbSurvey) => this.dbSurveyToSurvey(dbSurvey));
    } catch (error) {
      console.error("Error getting surveys by type:", error);
      throw new DatabaseError("Failed to get surveys by type", error);
    }
  }

  /**
   * Get featured surveys
   */
  async getFeaturedSurveys(): Promise<Survey[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getAllAsync<DatabaseSurvey>(
        'SELECT * FROM surveys WHERE isFeatured = 1 AND status = "published" ORDER BY createdAt DESC'
      );
      return result.map((dbSurvey) => this.dbSurveyToSurvey(dbSurvey));
    } catch (error) {
      console.error("Error getting featured surveys:", error);
      throw new DatabaseError("Failed to get featured surveys", error);
    }
  }

  /**
   * Upsert survey (insert or replace if exists)
   */
  async upsertSurvey(survey: Survey): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO surveys (
          id, title, description, type, status, icon, color,
          questions, results, totalTaken, isFeatured, version, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          survey.id,
          survey.title,
          survey.description || null,
          survey.type,
          survey.status,
          survey.icon || null,
          survey.color || null,
          JSON.stringify(survey.questions),
          survey.results ? JSON.stringify(survey.results) : null,
          survey.totalTaken,
          survey.isFeatured ? 1 : 0,
          survey.version,
          survey.createdAt,
          survey.updatedAt,
        ]
      );
    } catch (error) {
      console.error("Error upserting survey:", error);
      throw new DatabaseError("Failed to upsert survey", error);
    }
  }

  /**
   * Bulk upsert surveys (for sync)
   */
  async bulkUpsertSurveys(surveys: Survey[]): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      for (const survey of surveys) {
        await this.upsertSurvey(survey);
      }
      console.log(`Bulk upserted ${surveys.length} surveys`);
    } catch (error) {
      console.error("Error bulk upserting surveys:", error);
      throw new DatabaseError("Failed to bulk upsert surveys", error);
    }
  }

  /**
   * Delete survey by ID
   */
  async deleteSurvey(id: string): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.runAsync("DELETE FROM surveys WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error deleting survey:", error);
      throw new DatabaseError("Failed to delete survey", error);
    }
  }

  /**
   * Drop all tables (for testing)
   */
  async dropAllTables(): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.execAsync("DROP TABLE IF EXISTS events");
      await this.db.execAsync("DROP TABLE IF EXISTS articles");
      await this.db.execAsync("DROP TABLE IF EXISTS surveys");
      await this.db.execAsync("DROP TABLE IF EXISTS sync_metadata");
      await this.createTables();
      console.log("All tables dropped and recreated successfully");
    } catch (error) {
      console.error("Error dropping tables:", error);
      throw new DatabaseError("Failed to drop tables", error);
    }
  }

  /**
   * Save scheduled notification ID
   */
  async saveScheduledNotification(
    eventId: string,
    notificationId: string,
    daysBefore: number,
    scheduledAt: string
  ): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.runAsync(
        `INSERT INTO scheduled_notifications (eventId, notificationId, daysBefore, scheduledAt)
         VALUES (?, ?, ?, ?)`,
        [eventId, notificationId, daysBefore, scheduledAt]
      );
    } catch (error) {
      console.error("Error saving scheduled notification:", error);
      throw new DatabaseError("Failed to save scheduled notification", error);
    }
  }

  /**
   * Get scheduled notifications for an event
   */
  async getScheduledNotifications(eventId: string): Promise<
    Array<{
      id: number;
      eventId: string;
      notificationId: string;
      daysBefore: number;
      scheduledAt: string;
      createdAt: string;
    }>
  > {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getAllAsync<any>(
        "SELECT * FROM scheduled_notifications WHERE eventId = ?",
        [eventId]
      );
      return result;
    } catch (error) {
      console.error("Error getting scheduled notifications:", error);
      throw new DatabaseError("Failed to get scheduled notifications", error);
    }
  }

  /**
   * Delete scheduled notifications for an event
   */
  async deleteScheduledNotifications(eventId: string): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.runAsync(
        "DELETE FROM scheduled_notifications WHERE eventId = ?",
        [eventId]
      );
    } catch (error) {
      console.error("Error deleting scheduled notifications:", error);
      throw new DatabaseError(
        "Failed to delete scheduled notifications",
        error
      );
    }
  }

  /**
   * Get all scheduled notification IDs
   */
  async getAllScheduledNotificationIds(): Promise<string[]> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      const result = await this.db.getAllAsync<{ notificationId: string }>(
        "SELECT notificationId FROM scheduled_notifications"
      );
      return result.map((row) => row.notificationId);
    } catch (error) {
      console.error("Error getting all scheduled notification IDs:", error);
      throw new DatabaseError(
        "Failed to get all scheduled notification IDs",
        error
      );
    }
  }

  /**
   * Clear all scheduled notifications
   */
  async clearAllScheduledNotifications(): Promise<void> {
    if (!this.db) throw new DatabaseError("Database not initialized");

    try {
      await this.db.runAsync("DELETE FROM scheduled_notifications");
    } catch (error) {
      console.error("Error clearing scheduled notifications:", error);
      throw new DatabaseError("Failed to clear scheduled notifications", error);
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log("Database closed");
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
