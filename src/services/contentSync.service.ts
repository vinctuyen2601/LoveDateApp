import NetInfo from '@react-native-community/netinfo';
import { databaseService } from './database.service';
import { apiService } from './api.service';
import { Article, Survey } from '../types';

const CONTENT_SYNC_KEYS = {
  LAST_ARTICLE_VERSION: 'last_article_version',
  LAST_SURVEY_VERSION: 'last_survey_version',
  LAST_ARTICLE_SYNC: 'last_article_sync_at',
  LAST_SURVEY_SYNC: 'last_survey_sync_at',
};

interface ContentSyncResponse {
  articles: Article[];
  surveys: Survey[];
  lastArticleVersion: number;
  lastSurveyVersion: number;
  syncedAt: string;
}

class ContentSyncService {
  private isSyncing = false;

  /**
   * Sync articles and surveys from server
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

      // Get last sync versions
      const lastArticleVersion = await this.getLastArticleVersion();
      const lastSurveyVersion = await this.getLastSurveyVersion();

      console.log('Starting content sync...', {
        lastArticleVersion,
        lastSurveyVersion,
      });

      // Fetch updates from server
      const response = await apiService.get<ContentSyncResponse>('/sync/content', {
        params: {
          lastArticleVersion,
          lastSurveyVersion,
        },
      });

      if (!response) {
        throw new Error('Failed to fetch content updates');
      }

      const { articles, surveys, lastArticleVersion: newArticleVersion, lastSurveyVersion: newSurveyVersion } = response;

      console.log(`Received ${articles.length} articles, ${surveys.length} surveys`);

      // Update articles in database
      if (articles.length > 0) {
        await databaseService.bulkUpsertArticles(articles);
        await this.setLastArticleVersion(newArticleVersion);
        await this.setLastArticleSync(new Date().toISOString());
        console.log(`Synced ${articles.length} articles`);
      }

      // Update surveys in database
      if (surveys.length > 0) {
        await databaseService.bulkUpsertSurveys(surveys);
        await this.setLastSurveyVersion(newSurveyVersion);
        await this.setLastSurveySync(new Date().toISOString());
        console.log(`Synced ${surveys.length} surveys`);
      }

      console.log('Content sync completed successfully');
    } catch (error) {
      console.error('Content sync error:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Force full content sync (download all content)
   */
  async forceFullSync(): Promise<void> {
    try {
      // Reset sync versions to force full download
      await this.setLastArticleVersion(0);
      await this.setLastSurveyVersion(0);

      // Perform sync
      await this.syncContent();
    } catch (error) {
      console.error('Force full sync error:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const lastArticleVersion = await this.getLastArticleVersion();
    const lastSurveyVersion = await this.getLastSurveyVersion();
    const lastArticleSync = await this.getLastArticleSync();
    const lastSurveySync = await this.getLastSurveySync();

    return {
      lastArticleVersion,
      lastSurveyVersion,
      lastArticleSync,
      lastSurveySync,
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
}

// Export singleton instance
export const contentSyncService = new ContentSyncService();
