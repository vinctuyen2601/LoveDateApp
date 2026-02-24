import NetInfo from '@react-native-community/netinfo';
import { databaseService } from './database.service';
import { apiService } from './api.service';
import {
  Article,
  Survey,
  AffiliateProduct,
  ActivitySuggestion,
  GiftSuggestion,
  ChecklistTemplate,
  BadgeDefinition,
  SubscriptionProduct,
  ContentSyncResponse,
} from '../types';

const CONTENT_SYNC_KEYS = {
  LAST_ARTICLE_VERSION: 'last_article_version',
  LAST_SURVEY_VERSION: 'last_survey_version',
  LAST_PRODUCT_VERSION: 'last_product_version',
  LAST_ACTIVITY_VERSION: 'last_activity_version',
  LAST_GIFT_VERSION: 'last_gift_version',
  LAST_CHECKLIST_VERSION: 'last_checklist_version',
  LAST_BADGE_VERSION: 'last_badge_version',
  LAST_PLAN_VERSION: 'last_plan_version',
  LAST_ARTICLE_SYNC: 'last_article_sync_at',
  LAST_SURVEY_SYNC: 'last_survey_sync_at',
  LAST_PRODUCT_SYNC: 'last_product_sync_at',
  LAST_ACTIVITY_SYNC: 'last_activity_sync_at',
  LAST_GIFT_SYNC: 'last_gift_sync_at',
  LAST_CHECKLIST_SYNC: 'last_checklist_sync_at',
  LAST_BADGE_SYNC: 'last_badge_sync_at',
  LAST_PLAN_SYNC: 'last_plan_sync_at',
};

class ContentSyncService {
  private isSyncing = false;

  /**
   * Sync all 8 content types from CMS server
   */
  async syncContent(): Promise<void> {
    if (this.isSyncing) {
      console.log('Content sync already in progress');
      return;
    }

    try {
      this.isSyncing = true;

      // Check network
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('No internet connection, skipping content sync');
        return;
      }

      // Get last sync versions for all 8 content types
      const lastArticleVersion = await this.getLastArticleVersion();
      const lastSurveyVersion = await this.getLastSurveyVersion();
      const lastProductVersion = await this.getLastProductVersion();
      const lastActivityVersion = await this.getLastActivityVersion();
      const lastGiftVersion = await this.getLastGiftVersion();
      const lastChecklistVersion = await this.getLastChecklistVersion();
      const lastBadgeVersion = await this.getLastBadgeVersion();
      const lastPlanVersion = await this.getLastPlanVersion();

      console.log('Starting CMS content sync...', {
        lastArticleVersion,
        lastSurveyVersion,
        lastProductVersion,
        lastActivityVersion,
        lastGiftVersion,
        lastChecklistVersion,
        lastBadgeVersion,
        lastPlanVersion,
      });

      // Fetch updates from CMS server
      const response = await apiService.get<ContentSyncResponse>('/sync/content', {
        params: {
          lastArticleVersion,
          lastSurveyVersion,
          lastProductVersion,
          lastActivityVersion,
          lastGiftVersion,
          lastChecklistVersion,
          lastBadgeVersion,
          lastPlanVersion,
        },
      });

      if (!response) {
        throw new Error('Failed to fetch content updates from CMS');
      }

      const {
        articles,
        surveys,
        products,
        activities,
        giftSuggestions,
        checklistTemplates,
        badgeDefinitions,
        subscriptionPlans,
        lastArticleVersion: newArticleVersion,
        lastSurveyVersion: newSurveyVersion,
        lastProductVersion: newProductVersion,
        lastActivityVersion: newActivityVersion,
        lastGiftVersion: newGiftVersion,
        lastChecklistVersion: newChecklistVersion,
        lastBadgeVersion: newBadgeVersion,
        lastPlanVersion: newPlanVersion,
      } = response;

      console.log(
        `Received: ${articles.length} articles, ${surveys.length} surveys, ${products.length} products, ` +
          `${activities.length} activities, ${giftSuggestions.length} gifts, ${checklistTemplates.length} checklists, ` +
          `${badgeDefinitions.length} badges, ${subscriptionPlans.length} plans`
      );

      // Update all content types in database
      if (articles.length > 0) {
        await databaseService.bulkUpsertArticles(articles);
        await this.setLastArticleVersion(newArticleVersion);
        await this.setLastArticleSync(new Date().toISOString());
        console.log(`✓ Synced ${articles.length} articles`);
      }

      if (surveys.length > 0) {
        await databaseService.bulkUpsertSurveys(surveys);
        await this.setLastSurveyVersion(newSurveyVersion);
        await this.setLastSurveySync(new Date().toISOString());
        console.log(`✓ Synced ${surveys.length} surveys`);
      }

      if (products.length > 0) {
        await databaseService.bulkUpsertProducts(products);
        await this.setLastProductVersion(newProductVersion);
        await this.setLastProductSync(new Date().toISOString());
        console.log(`✓ Synced ${products.length} products`);
      }

      if (activities.length > 0) {
        await databaseService.bulkUpsertActivities(activities);
        await this.setLastActivityVersion(newActivityVersion);
        await this.setLastActivitySync(new Date().toISOString());
        console.log(`✓ Synced ${activities.length} activities`);
      }

      if (giftSuggestions.length > 0) {
        await databaseService.bulkUpsertGiftSuggestions(giftSuggestions);
        await this.setLastGiftVersion(newGiftVersion);
        await this.setLastGiftSync(new Date().toISOString());
        console.log(`✓ Synced ${giftSuggestions.length} gift suggestions`);
      }

      if (checklistTemplates.length > 0) {
        await databaseService.bulkUpsertChecklistTemplates(checklistTemplates);
        await this.setLastChecklistVersion(newChecklistVersion);
        await this.setLastChecklistSync(new Date().toISOString());
        console.log(`✓ Synced ${checklistTemplates.length} checklist templates`);
      }

      if (badgeDefinitions.length > 0) {
        await databaseService.bulkUpsertBadgeDefinitions(badgeDefinitions);
        await this.setLastBadgeVersion(newBadgeVersion);
        await this.setLastBadgeSync(new Date().toISOString());
        console.log(`✓ Synced ${badgeDefinitions.length} badge definitions`);
      }

      if (subscriptionPlans.length > 0) {
        await databaseService.bulkUpsertSubscriptionPlans(subscriptionPlans);
        await this.setLastPlanVersion(newPlanVersion);
        await this.setLastPlanSync(new Date().toISOString());
        console.log(`✓ Synced ${subscriptionPlans.length} subscription plans`);
      }

      console.log('✅ CMS content sync completed successfully');
    } catch (error) {
      console.error('❌ CMS content sync error:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Force full content sync (download all content from CMS)
   */
  async forceFullSync(): Promise<void> {
    try {
      // Reset all sync versions to force full download
      await Promise.all([
        this.setLastArticleVersion(0),
        this.setLastSurveyVersion(0),
        this.setLastProductVersion(0),
        this.setLastActivityVersion(0),
        this.setLastGiftVersion(0),
        this.setLastChecklistVersion(0),
        this.setLastBadgeVersion(0),
        this.setLastPlanVersion(0),
      ]);

      console.log('🔄 Force full CMS sync initiated');

      // Perform sync
      await this.syncContent();
    } catch (error) {
      console.error('❌ Force full sync error:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive sync status for all 8 content types
   */
  async getSyncStatus() {
    const [
      lastArticleVersion,
      lastSurveyVersion,
      lastProductVersion,
      lastActivityVersion,
      lastGiftVersion,
      lastChecklistVersion,
      lastBadgeVersion,
      lastPlanVersion,
      lastArticleSync,
      lastSurveySync,
      lastProductSync,
      lastActivitySync,
      lastGiftSync,
      lastChecklistSync,
      lastBadgeSync,
      lastPlanSync,
    ] = await Promise.all([
      this.getLastArticleVersion(),
      this.getLastSurveyVersion(),
      this.getLastProductVersion(),
      this.getLastActivityVersion(),
      this.getLastGiftVersion(),
      this.getLastChecklistVersion(),
      this.getLastBadgeVersion(),
      this.getLastPlanVersion(),
      this.getLastArticleSync(),
      this.getLastSurveySync(),
      this.getLastProductSync(),
      this.getLastActivitySync(),
      this.getLastGiftSync(),
      this.getLastChecklistSync(),
      this.getLastBadgeSync(),
      this.getLastPlanSync(),
    ]);

    return {
      versions: {
        articles: lastArticleVersion,
        surveys: lastSurveyVersion,
        products: lastProductVersion,
        activities: lastActivityVersion,
        gifts: lastGiftVersion,
        checklists: lastChecklistVersion,
        badges: lastBadgeVersion,
        plans: lastPlanVersion,
      },
      lastSync: {
        articles: lastArticleSync,
        surveys: lastSurveySync,
        products: lastProductSync,
        activities: lastActivitySync,
        gifts: lastGiftSync,
        checklists: lastChecklistSync,
        badges: lastBadgeSync,
        plans: lastPlanSync,
      },
      isSyncing: this.isSyncing,
    };
  }

  // ==================== PRIVATE HELPERS ====================

  private async getLastArticleVersion(): Promise<number> {
    const value = await databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_ARTICLE_VERSION);
    return value ? parseInt(value, 10) : 0;
  }

  private async setLastArticleVersion(version: number): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_ARTICLE_VERSION, version.toString());
  }

  private async getLastSurveyVersion(): Promise<number> {
    const value = await databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_SURVEY_VERSION);
    return value ? parseInt(value, 10) : 0;
  }

  private async setLastSurveyVersion(version: number): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_SURVEY_VERSION, version.toString());
  }

  private async getLastArticleSync(): Promise<string | null> {
    return databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_ARTICLE_SYNC);
  }

  private async setLastArticleSync(timestamp: string): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_ARTICLE_SYNC, timestamp);
  }

  private async getLastSurveySync(): Promise<string | null> {
    return databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_SURVEY_SYNC);
  }

  private async setLastSurveySync(timestamp: string): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_SURVEY_SYNC, timestamp);
  }

  // Products
  private async getLastProductVersion(): Promise<number> {
    const value = await databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_PRODUCT_VERSION);
    return value ? parseInt(value, 10) : 0;
  }

  private async setLastProductVersion(version: number): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_PRODUCT_VERSION, version.toString());
  }

  private async getLastProductSync(): Promise<string | null> {
    return databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_PRODUCT_SYNC);
  }

  private async setLastProductSync(timestamp: string): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_PRODUCT_SYNC, timestamp);
  }

  // Activities
  private async getLastActivityVersion(): Promise<number> {
    const value = await databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_ACTIVITY_VERSION);
    return value ? parseInt(value, 10) : 0;
  }

  private async setLastActivityVersion(version: number): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_ACTIVITY_VERSION, version.toString());
  }

  private async getLastActivitySync(): Promise<string | null> {
    return databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_ACTIVITY_SYNC);
  }

  private async setLastActivitySync(timestamp: string): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_ACTIVITY_SYNC, timestamp);
  }

  // Gift Suggestions
  private async getLastGiftVersion(): Promise<number> {
    const value = await databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_GIFT_VERSION);
    return value ? parseInt(value, 10) : 0;
  }

  private async setLastGiftVersion(version: number): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_GIFT_VERSION, version.toString());
  }

  private async getLastGiftSync(): Promise<string | null> {
    return databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_GIFT_SYNC);
  }

  private async setLastGiftSync(timestamp: string): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_GIFT_SYNC, timestamp);
  }

  // Checklist Templates
  private async getLastChecklistVersion(): Promise<number> {
    const value = await databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_CHECKLIST_VERSION);
    return value ? parseInt(value, 10) : 0;
  }

  private async setLastChecklistVersion(version: number): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_CHECKLIST_VERSION, version.toString());
  }

  private async getLastChecklistSync(): Promise<string | null> {
    return databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_CHECKLIST_SYNC);
  }

  private async setLastChecklistSync(timestamp: string): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_CHECKLIST_SYNC, timestamp);
  }

  // Badge Definitions
  private async getLastBadgeVersion(): Promise<number> {
    const value = await databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_BADGE_VERSION);
    return value ? parseInt(value, 10) : 0;
  }

  private async setLastBadgeVersion(version: number): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_BADGE_VERSION, version.toString());
  }

  private async getLastBadgeSync(): Promise<string | null> {
    return databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_BADGE_SYNC);
  }

  private async setLastBadgeSync(timestamp: string): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_BADGE_SYNC, timestamp);
  }

  // Subscription Plans
  private async getLastPlanVersion(): Promise<number> {
    const value = await databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_PLAN_VERSION);
    return value ? parseInt(value, 10) : 0;
  }

  private async setLastPlanVersion(version: number): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_PLAN_VERSION, version.toString());
  }

  private async getLastPlanSync(): Promise<string | null> {
    return databaseService.getSyncMetadata(CONTENT_SYNC_KEYS.LAST_PLAN_SYNC);
  }

  private async setLastPlanSync(timestamp: string): Promise<void> {
    await databaseService.setSyncMetadata(CONTENT_SYNC_KEYS.LAST_PLAN_SYNC, timestamp);
  }
}

// Export singleton instance
export const contentSyncService = new ContentSyncService();
