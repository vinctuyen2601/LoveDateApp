import * as SQLite from 'expo-sqlite';
import { ActivitySuggestion, DatabaseActivitySuggestion } from '../types';
import { ACTIVITY_SEED_DATA } from '../data/activitySeedData';

/**
 * Activity Suggestion Service (Phase 2 - Task 5)
 *
 * Manages activity suggestions for events:
 * - Restaurants
 * - Entertainment activities (cinema, karaoke, spa, etc.)
 * - Tourist locations and landmarks
 */

// ==================== CONVERTERS ====================

function dbActivityToActivity(dbActivity: DatabaseActivitySuggestion): ActivitySuggestion {
  return {
    id: dbActivity.id,
    name: dbActivity.name,
    category: dbActivity.category as 'restaurant' | 'activity' | 'location',
    location: dbActivity.location || undefined,
    address: dbActivity.address || undefined,
    priceRange: (dbActivity.priceRange as any) || undefined,
    rating: dbActivity.rating || undefined,
    bookingUrl: dbActivity.bookingUrl || undefined,
    phoneNumber: dbActivity.phoneNumber || undefined,
    imageUrl: dbActivity.imageUrl || undefined,
    description: dbActivity.description || undefined,
    tags: dbActivity.tags ? JSON.parse(dbActivity.tags) : undefined,
    createdAt: dbActivity.createdAt,
    updatedAt: dbActivity.updatedAt,
  };
}

function activityToDbActivity(activity: ActivitySuggestion): Omit<DatabaseActivitySuggestion, 'createdAt' | 'updatedAt'> {
  return {
    id: activity.id,
    name: activity.name,
    category: activity.category,
    location: activity.location || null,
    address: activity.address || null,
    priceRange: activity.priceRange || null,
    rating: activity.rating || null,
    bookingUrl: activity.bookingUrl || null,
    phoneNumber: activity.phoneNumber || null,
    imageUrl: activity.imageUrl || null,
    description: activity.description || null,
    tags: activity.tags ? JSON.stringify(activity.tags) : null,
  };
}

// ==================== DATABASE OPERATIONS ====================

/**
 * Seed activity suggestions from predefined data
 * This should be called once during app initialization
 */
export async function seedActivitySuggestions(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Check if data already exists
    const existing = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM activity_suggestions'
    );

    if (existing && existing.count > 0) {
      console.log('✅ Activity suggestions already seeded');
      return;
    }

    console.log('🌱 Seeding activity suggestions...');

    // Prepare seed data with timestamps
    const now = new Date().toISOString();
    const seedData = ACTIVITY_SEED_DATA.map((activity, index) => ({
      ...activity,
      id: `activity_seed_${Date.now()}_${index}`,
      createdAt: now,
      updatedAt: now,
    }));

    // Insert all seed data
    await db.withTransactionAsync(async () => {
      for (const activity of seedData) {
        const dbActivity = activityToDbActivity(activity);
        await db.runAsync(
          `INSERT INTO activity_suggestions
          (id, name, category, location, address, priceRange, rating, bookingUrl, phoneNumber, imageUrl, description, tags, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dbActivity.id,
            dbActivity.name,
            dbActivity.category,
            dbActivity.location,
            dbActivity.address,
            dbActivity.priceRange,
            dbActivity.rating,
            dbActivity.bookingUrl,
            dbActivity.phoneNumber,
            dbActivity.imageUrl,
            dbActivity.description,
            dbActivity.tags,
            activity.createdAt,
            activity.updatedAt,
          ]
        );
      }
    });

    console.log(`✅ Seeded ${seedData.length} activity suggestions`);
  } catch (error) {
    console.error('❌ Error seeding activity suggestions:', error);
    throw error;
  }
}

/**
 * Get all activity suggestions
 */
export async function getAllActivities(db: SQLite.SQLiteDatabase): Promise<ActivitySuggestion[]> {
  try {
    const results = await db.getAllAsync<DatabaseActivitySuggestion>(
      'SELECT * FROM activity_suggestions ORDER BY rating DESC, name ASC'
    );
    return results.map(dbActivityToActivity);
  } catch (error) {
    console.error('Error getting all activities:', error);
    return [];
  }
}

/**
 * Get activities by category
 */
export async function getActivitiesByCategory(
  db: SQLite.SQLiteDatabase,
  category: 'restaurant' | 'activity' | 'location'
): Promise<ActivitySuggestion[]> {
  try {
    const results = await db.getAllAsync<DatabaseActivitySuggestion>(
      'SELECT * FROM activity_suggestions WHERE category = ? ORDER BY rating DESC, name ASC',
      [category]
    );
    return results.map(dbActivityToActivity);
  } catch (error) {
    console.error('Error getting activities by category:', error);
    return [];
  }
}

/**
 * Get activities by location
 */
export async function getActivitiesByLocation(
  db: SQLite.SQLiteDatabase,
  location: string
): Promise<ActivitySuggestion[]> {
  try {
    const results = await db.getAllAsync<DatabaseActivitySuggestion>(
      'SELECT * FROM activity_suggestions WHERE location LIKE ? ORDER BY rating DESC, name ASC',
      [`%${location}%`]
    );
    return results.map(dbActivityToActivity);
  } catch (error) {
    console.error('Error getting activities by location:', error);
    return [];
  }
}

/**
 * Get activities by price range
 */
export async function getActivitiesByPriceRange(
  db: SQLite.SQLiteDatabase,
  priceRange: string
): Promise<ActivitySuggestion[]> {
  try {
    const results = await db.getAllAsync<DatabaseActivitySuggestion>(
      'SELECT * FROM activity_suggestions WHERE priceRange = ? ORDER BY rating DESC, name ASC',
      [priceRange]
    );
    return results.map(dbActivityToActivity);
  } catch (error) {
    console.error('Error getting activities by price range:', error);
    return [];
  }
}

/**
 * Search activities by name or tags
 */
export async function searchActivities(
  db: SQLite.SQLiteDatabase,
  query: string
): Promise<ActivitySuggestion[]> {
  try {
    const results = await db.getAllAsync<DatabaseActivitySuggestion>(
      `SELECT * FROM activity_suggestions
       WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?
       ORDER BY rating DESC, name ASC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    return results.map(dbActivityToActivity);
  } catch (error) {
    console.error('Error searching activities:', error);
    return [];
  }
}

/**
 * Get activities with filters
 */
export interface ActivityFilters {
  category?: 'restaurant' | 'activity' | 'location';
  location?: string;
  priceRange?: string;
  minRating?: number;
  tags?: string[];
}

export async function getActivitiesWithFilters(
  db: SQLite.SQLiteDatabase,
  filters: ActivityFilters
): Promise<ActivitySuggestion[]> {
  try {
    let query = 'SELECT * FROM activity_suggestions WHERE 1=1';
    const params: any[] = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.location) {
      query += ' AND location LIKE ?';
      params.push(`%${filters.location}%`);
    }

    if (filters.priceRange) {
      query += ' AND priceRange = ?';
      params.push(filters.priceRange);
    }

    if (filters.minRating) {
      query += ' AND rating >= ?';
      params.push(filters.minRating);
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(() => 'tags LIKE ?').join(' OR ');
      query += ` AND (${tagConditions})`;
      filters.tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    query += ' ORDER BY rating DESC, name ASC';

    const results = await db.getAllAsync<DatabaseActivitySuggestion>(query, params);
    return results.map(dbActivityToActivity);
  } catch (error) {
    console.error('Error getting activities with filters:', error);
    return [];
  }
}

/**
 * Get top-rated activities
 */
export async function getTopRatedActivities(
  db: SQLite.SQLiteDatabase,
  limit: number = 10,
  category?: 'restaurant' | 'activity' | 'location'
): Promise<ActivitySuggestion[]> {
  try {
    let query = 'SELECT * FROM activity_suggestions WHERE rating IS NOT NULL';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY rating DESC, name ASC LIMIT ?';
    params.push(limit);

    const results = await db.getAllAsync<DatabaseActivitySuggestion>(query, params);
    return results.map(dbActivityToActivity);
  } catch (error) {
    console.error('Error getting top-rated activities:', error);
    return [];
  }
}

/**
 * Get random activity suggestions
 * Useful for "Surprise me!" feature
 */
export async function getRandomActivities(
  db: SQLite.SQLiteDatabase,
  count: number = 3,
  category?: 'restaurant' | 'activity' | 'location'
): Promise<ActivitySuggestion[]> {
  try {
    let query = 'SELECT * FROM activity_suggestions WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(count);

    const results = await db.getAllAsync<DatabaseActivitySuggestion>(query, params);
    return results.map(dbActivityToActivity);
  } catch (error) {
    console.error('Error getting random activities:', error);
    return [];
  }
}

/**
 * Get activity by ID
 */
export async function getActivityById(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<ActivitySuggestion | null> {
  try {
    const result = await db.getFirstAsync<DatabaseActivitySuggestion>(
      'SELECT * FROM activity_suggestions WHERE id = ?',
      [id]
    );
    return result ? dbActivityToActivity(result) : null;
  } catch (error) {
    console.error('Error getting activity by ID:', error);
    return null;
  }
}

/**
 * Get suggested activities for an event based on tags
 * Smart suggestions based on event context
 */
export async function getSuggestedActivitiesForEvent(
  db: SQLite.SQLiteDatabase,
  eventTags: string[]
): Promise<{
  restaurants: ActivitySuggestion[];
  activities: ActivitySuggestion[];
  locations: ActivitySuggestion[];
}> {
  try {
    // Determine filters based on event tags
    const isRomantic = eventTags.some(tag =>
      ['anniversary', 'wife', 'husband', 'girlfriend', 'boyfriend'].includes(tag)
    );
    const isBirthday = eventTags.includes('birthday');
    const isFamily = eventTags.includes('family');

    const filters: ActivityFilters = {};

    // Add tag-based filters
    if (isRomantic) {
      filters.tags = ['Romantic', 'Fine Dining', 'Rooftop'];
      filters.minRating = 4.3;
    } else if (isBirthday) {
      filters.tags = ['Entertainment', 'Celebration'];
    } else if (isFamily) {
      filters.tags = ['Family Friendly', 'Casual'];
    }

    // Get suggestions for each category
    const [restaurants, activities, locations] = await Promise.all([
      getActivitiesWithFilters(db, { ...filters, category: 'restaurant' }),
      getActivitiesWithFilters(db, { ...filters, category: 'activity' }),
      getActivitiesWithFilters(db, { ...filters, category: 'location' }),
    ]);

    return {
      restaurants: restaurants.slice(0, 5),
      activities: activities.slice(0, 5),
      locations: locations.slice(0, 5),
    };
  } catch (error) {
    console.error('Error getting suggested activities for event:', error);
    return {
      restaurants: [],
      activities: [],
      locations: [],
    };
  }
}

/**
 * Get activity statistics
 */
export async function getActivityStats(db: SQLite.SQLiteDatabase): Promise<{
  totalCount: number;
  restaurantCount: number;
  activityCount: number;
  locationCount: number;
  averageRating: number;
}> {
  try {
    const [total, restaurants, activities, locations, avgRating] = await Promise.all([
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM activity_suggestions'),
      db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM activity_suggestions WHERE category = 'restaurant'"
      ),
      db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM activity_suggestions WHERE category = 'activity'"
      ),
      db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM activity_suggestions WHERE category = 'location'"
      ),
      db.getFirstAsync<{ avg: number }>(
        'SELECT AVG(rating) as avg FROM activity_suggestions WHERE rating IS NOT NULL'
      ),
    ]);

    return {
      totalCount: total?.count || 0,
      restaurantCount: restaurants?.count || 0,
      activityCount: activities?.count || 0,
      locationCount: locations?.count || 0,
      averageRating: avgRating?.avg || 0,
    };
  } catch (error) {
    console.error('Error getting activity stats:', error);
    return {
      totalCount: 0,
      restaurantCount: 0,
      activityCount: 0,
      locationCount: 0,
      averageRating: 0,
    };
  }
}

/**
 * Add custom activity suggestion
 * (For future feature: allow users to add their own favorites)
 */
export async function addCustomActivity(
  db: SQLite.SQLiteDatabase,
  activity: Omit<ActivitySuggestion, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ActivitySuggestion> {
  try {
    const now = new Date().toISOString();
    const id = `activity_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newActivity: ActivitySuggestion = {
      ...activity,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const dbActivity = activityToDbActivity(newActivity);

    await db.runAsync(
      `INSERT INTO activity_suggestions
      (id, name, category, location, address, priceRange, rating, bookingUrl, phoneNumber, imageUrl, description, tags, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dbActivity.id,
        dbActivity.name,
        dbActivity.category,
        dbActivity.location,
        dbActivity.address,
        dbActivity.priceRange,
        dbActivity.rating,
        dbActivity.bookingUrl,
        dbActivity.phoneNumber,
        dbActivity.imageUrl,
        dbActivity.description,
        dbActivity.tags,
        newActivity.createdAt,
        newActivity.updatedAt,
      ]
    );

    return newActivity;
  } catch (error) {
    console.error('Error adding custom activity:', error);
    throw error;
  }
}
