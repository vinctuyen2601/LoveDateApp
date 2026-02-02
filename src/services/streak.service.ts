import * as SQLite from 'expo-sqlite';
import { UserStats, DatabaseUserStats, Achievement, DatabaseAchievement, BadgeType, BadgeDefinition } from '../types';
import { COLORS } from '../constants/colors';

/**
 * Streak Service (Phase 3 - Task 7: Gamification)
 *
 * Manages user statistics and streak tracking:
 * - Daily streak calculation
 * - Activity tracking
 * - Badge/achievement earning
 */

// ==================== BADGE DEFINITIONS ====================

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: 'beginner',
    name: 'Người mới',
    description: 'Tạo sự kiện đầu tiên',
    icon: 'rocket',
    color: COLORS.primary,
    requirement: 1,
    category: 'events',
  },
  {
    type: 'perfect_partner',
    name: 'Đối tác hoàn hảo',
    description: 'Tạo 10 sự kiện không quên',
    icon: 'heart',
    color: COLORS.categoryBirthday,
    requirement: 10,
    category: 'events',
  },
  {
    type: 'consistent',
    name: 'Kiên định',
    description: 'Duy trì streak 7 ngày',
    icon: 'flame',
    color: COLORS.warning,
    requirement: 7,
    category: 'streak',
  },
  {
    type: 'streak_master',
    name: 'Bậc thầy streak',
    description: 'Duy trì streak 30 ngày',
    icon: 'trophy',
    color: COLORS.success,
    requirement: 30,
    category: 'streak',
  },
  {
    type: 'planner',
    name: 'Nhà lập kế hoạch',
    description: 'Hoàn thành 20 checklist 100%',
    icon: 'checkmark-done-circle',
    color: COLORS.secondary,
    requirement: 20,
    category: 'checklist',
  },
  {
    type: 'organizer',
    name: 'Người tổ chức',
    description: 'Hoàn thành 50+ mục trong checklist',
    icon: 'list',
    color: COLORS.primary,
    requirement: 50,
    category: 'checklist',
  },
  {
    type: 'thoughtful',
    name: 'Chu đáo',
    description: '5 quà được đánh giá 5 sao',
    icon: 'star',
    color: COLORS.warning,
    requirement: 5,
    category: 'gifts',
  },
  {
    type: 'generous',
    name: 'Hào phóng',
    description: 'Mua 10+ món quà',
    icon: 'gift',
    color: COLORS.categoryAnniversary,
    requirement: 10,
    category: 'gifts',
  },
  {
    type: 'early_bird',
    name: 'Chim sớm',
    description: 'Tạo 10 sự kiện trước 7 ngày',
    icon: 'time',
    color: COLORS.categoryHoliday,
    requirement: 10,
    category: 'events',
  },
];

// ==================== CONVERTERS ====================

function dbStatsToStats(dbStats: DatabaseUserStats): UserStats {
  return {
    id: dbStats.id,
    userId: dbStats.userId,
    currentStreak: dbStats.currentStreak,
    longestStreak: dbStats.longestStreak,
    totalEventsCreated: dbStats.totalEventsCreated,
    totalEventsCompleted: dbStats.totalEventsCompleted,
    totalChecklistsCompleted: dbStats.totalChecklistsCompleted,
    totalGiftsPurchased: dbStats.totalGiftsPurchased,
    lastActivityDate: dbStats.lastActivityDate || undefined,
    createdAt: dbStats.createdAt,
    updatedAt: dbStats.updatedAt,
  };
}

function dbAchievementToAchievement(dbAchievement: DatabaseAchievement): Achievement {
  return {
    id: dbAchievement.id,
    userId: dbAchievement.userId,
    badgeType: dbAchievement.badgeType as BadgeType,
    badgeName: dbAchievement.badgeName,
    badgeDescription: dbAchievement.badgeDescription || undefined,
    earnedAt: dbAchievement.earnedAt,
    notified: Boolean(dbAchievement.notified),
  };
}

// ==================== USER STATS MANAGEMENT ====================

/**
 * Get or create user stats
 */
export async function getUserStats(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<UserStats> {
  try {
    const existing = await db.getFirstAsync<DatabaseUserStats>(
      'SELECT * FROM user_stats WHERE userId = ?',
      [userId]
    );

    if (existing) {
      return dbStatsToStats(existing);
    }

    // Create new stats
    const now = new Date().toISOString();
    const id = `stats_${userId}_${Date.now()}`;

    await db.runAsync(
      `INSERT INTO user_stats (id, userId, currentStreak, longestStreak, totalEventsCreated,
       totalEventsCompleted, totalChecklistsCompleted, totalGiftsPurchased, lastActivityDate, createdAt, updatedAt)
       VALUES (?, ?, 0, 0, 0, 0, 0, 0, NULL, ?, ?)`,
      [id, userId, now, now]
    );

    return {
      id,
      userId,
      currentStreak: 0,
      longestStreak: 0,
      totalEventsCreated: 0,
      totalEventsCompleted: 0,
      totalChecklistsCompleted: 0,
      totalGiftsPurchased: 0,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
}

/**
 * Update user stats
 */
export async function updateUserStats(
  db: SQLite.SQLiteDatabase,
  userId: string,
  updates: Partial<Omit<UserStats, 'id' | 'userId' | 'createdAt'>>
): Promise<UserStats> {
  try {
    const now = new Date().toISOString();
    const stats = await getUserStats(db, userId);

    // Build update query
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.currentStreak !== undefined) {
      fields.push('currentStreak = ?');
      values.push(updates.currentStreak);
    }
    if (updates.longestStreak !== undefined) {
      fields.push('longestStreak = ?');
      values.push(updates.longestStreak);
    }
    if (updates.totalEventsCreated !== undefined) {
      fields.push('totalEventsCreated = ?');
      values.push(updates.totalEventsCreated);
    }
    if (updates.totalEventsCompleted !== undefined) {
      fields.push('totalEventsCompleted = ?');
      values.push(updates.totalEventsCompleted);
    }
    if (updates.totalChecklistsCompleted !== undefined) {
      fields.push('totalChecklistsCompleted = ?');
      values.push(updates.totalChecklistsCompleted);
    }
    if (updates.totalGiftsPurchased !== undefined) {
      fields.push('totalGiftsPurchased = ?');
      values.push(updates.totalGiftsPurchased);
    }
    if (updates.lastActivityDate !== undefined) {
      fields.push('lastActivityDate = ?');
      values.push(updates.lastActivityDate || null);
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(userId);

    await db.runAsync(
      `UPDATE user_stats SET ${fields.join(', ')} WHERE userId = ?`,
      values
    );

    return getUserStats(db, userId);
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
}

// ==================== STREAK CALCULATION ====================

/**
 * Calculate and update streak
 */
export async function updateStreak(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<{ currentStreak: number; longestStreak: number; isNewRecord: boolean }> {
  try {
    const stats = await getUserStats(db, userId);
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = stats.lastActivityDate?.split('T')[0];

    let newStreak = stats.currentStreak;
    let isNewRecord = false;

    if (!lastActivity) {
      // First activity ever
      newStreak = 1;
    } else if (lastActivity === today) {
      // Already counted today, no change
      return {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        isNewRecord: false,
      };
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivity === yesterdayStr) {
        // Consecutive day
        newStreak = stats.currentStreak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    // Update longest streak if needed
    const newLongest = Math.max(newStreak, stats.longestStreak);
    isNewRecord = newLongest > stats.longestStreak;

    await updateUserStats(db, userId, {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: new Date().toISOString(),
    });

    return {
      currentStreak: newStreak,
      longestStreak: newLongest,
      isNewRecord,
    };
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
}

/**
 * Increment event created counter and check for badges
 */
export async function trackEventCreated(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<Achievement[]> {
  try {
    const stats = await getUserStats(db, userId);
    await updateUserStats(db, userId, {
      totalEventsCreated: stats.totalEventsCreated + 1,
    });

    // Update streak
    await updateStreak(db, userId);

    // Check for new badges
    return checkAndAwardBadges(db, userId);
  } catch (error) {
    console.error('Error tracking event created:', error);
    return [];
  }
}

/**
 * Track checklist completion
 */
export async function trackChecklistCompleted(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<Achievement[]> {
  try {
    const stats = await getUserStats(db, userId);
    await updateUserStats(db, userId, {
      totalChecklistsCompleted: stats.totalChecklistsCompleted + 1,
    });

    await updateStreak(db, userId);
    return checkAndAwardBadges(db, userId);
  } catch (error) {
    console.error('Error tracking checklist completed:', error);
    return [];
  }
}

/**
 * Track gift purchased
 */
export async function trackGiftPurchased(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<Achievement[]> {
  try {
    const stats = await getUserStats(db, userId);
    await updateUserStats(db, userId, {
      totalGiftsPurchased: stats.totalGiftsPurchased + 1,
    });

    await updateStreak(db, userId);
    return checkAndAwardBadges(db, userId);
  } catch (error) {
    console.error('Error tracking gift purchased:', error);
    return [];
  }
}

// ==================== ACHIEVEMENT MANAGEMENT ====================

/**
 * Get user achievements
 */
export async function getUserAchievements(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<Achievement[]> {
  try {
    const results = await db.getAllAsync<DatabaseAchievement>(
      'SELECT * FROM achievements WHERE userId = ? ORDER BY earnedAt DESC',
      [userId]
    );
    return results.map(dbAchievementToAchievement);
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
}

/**
 * Award a badge to user
 */
export async function awardBadge(
  db: SQLite.SQLiteDatabase,
  userId: string,
  badgeType: BadgeType
): Promise<Achievement | null> {
  try {
    // Check if already earned
    const existing = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM achievements WHERE userId = ? AND badgeType = ?',
      [userId, badgeType]
    );

    if (existing && existing.count > 0) {
      return null; // Already earned
    }

    const badge = BADGE_DEFINITIONS.find((b) => b.type === badgeType);
    if (!badge) {
      console.warn('Badge definition not found:', badgeType);
      return null;
    }

    const now = new Date().toISOString();
    const id = `achievement_${userId}_${badgeType}_${Date.now()}`;

    await db.runAsync(
      `INSERT INTO achievements (id, userId, badgeType, badgeName, badgeDescription, earnedAt, notified)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [id, userId, badgeType, badge.name, badge.description, now]
    );

    console.log(`🏆 Badge earned: ${badge.name}`);

    return {
      id,
      userId,
      badgeType,
      badgeName: badge.name,
      badgeDescription: badge.description,
      earnedAt: now,
      notified: false,
    };
  } catch (error) {
    console.error('Error awarding badge:', error);
    return null;
  }
}

/**
 * Check stats and award badges if requirements met
 */
export async function checkAndAwardBadges(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<Achievement[]> {
  try {
    const stats = await getUserStats(db, userId);
    const achievements = await getUserAchievements(db, userId);
    const earnedTypes = new Set(achievements.map((a) => a.badgeType));
    const newBadges: Achievement[] = [];

    // Check each badge definition
    for (const badge of BADGE_DEFINITIONS) {
      if (earnedTypes.has(badge.type)) {
        continue; // Already earned
      }

      let shouldAward = false;

      switch (badge.category) {
        case 'events':
          if (badge.type === 'perfect_partner' && stats.totalEventsCreated >= badge.requirement) {
            shouldAward = true;
          }
          if (badge.type === 'beginner' && stats.totalEventsCreated >= badge.requirement) {
            shouldAward = true;
          }
          // early_bird requires special check
          if (badge.type === 'early_bird') {
            const earlyEvents = await db.getFirstAsync<{ count: number }>(
              `SELECT COUNT(*) as count FROM events
               WHERE isDeleted = 0
               AND julianday(eventDate) - julianday(createdAt) >= 7`
            );
            if (earlyEvents && earlyEvents.count >= badge.requirement) {
              shouldAward = true;
            }
          }
          break;

        case 'streak':
          if (stats.currentStreak >= badge.requirement) {
            shouldAward = true;
          }
          break;

        case 'checklist':
          if (badge.type === 'planner' && stats.totalChecklistsCompleted >= badge.requirement) {
            shouldAward = true;
          }
          if (badge.type === 'organizer') {
            // Count total completed checklist items
            const completedItems = await db.getFirstAsync<{ count: number }>(
              'SELECT COUNT(*) as count FROM checklist_items WHERE isCompleted = 1'
            );
            if (completedItems && completedItems.count >= badge.requirement) {
              shouldAward = true;
            }
          }
          break;

        case 'gifts':
          if (badge.type === 'generous' && stats.totalGiftsPurchased >= badge.requirement) {
            shouldAward = true;
          }
          if (badge.type === 'thoughtful') {
            // Check for 5-star gifts
            const fiveStarGifts = await db.getFirstAsync<{ count: number }>(
              'SELECT COUNT(*) as count FROM gift_history WHERE rating = 5'
            );
            if (fiveStarGifts && fiveStarGifts.count >= badge.requirement) {
              shouldAward = true;
            }
          }
          break;
      }

      if (shouldAward) {
        const achievement = await awardBadge(db, userId, badge.type);
        if (achievement) {
          newBadges.push(achievement);
        }
      }
    }

    return newBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
}

/**
 * Mark achievement as notified
 */
export async function markAchievementNotified(
  db: SQLite.SQLiteDatabase,
  achievementId: string
): Promise<void> {
  try {
    await db.runAsync(
      'UPDATE achievements SET notified = 1 WHERE id = ?',
      [achievementId]
    );
  } catch (error) {
    console.error('Error marking achievement notified:', error);
  }
}

/**
 * Get badge definition by type
 */
export function getBadgeDefinition(badgeType: BadgeType): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.type === badgeType);
}
