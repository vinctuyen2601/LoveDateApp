import { databaseService } from './database.service';
import { defaultArticles } from '../data/articles';

const SEED_FLAG_KEY = 'data_seeded';

class DataSeedService {
  /**
   * Seed default data on first app launch
   */
  async seedDefaultData(): Promise<void> {
    try {
      // Check if data has been seeded before
      const hasSeeded = await databaseService.getSyncMetadata(SEED_FLAG_KEY);

      if (hasSeeded === 'true') {
        console.log('Default data already seeded, skipping...');
        return;
      }

      console.log('Seeding default data...');

      // Seed default articles
      await this.seedArticles();

      // Mark as seeded
      await databaseService.setSyncMetadata(SEED_FLAG_KEY, 'true');

      console.log('Default data seeding completed');
    } catch (error) {
      console.error('Error seeding default data:', error);
      throw error;
    }
  }

  /**
   * Seed default articles
   */
  private async seedArticles(): Promise<void> {
    try {
      // Check if any articles exist
      const existingArticles = await databaseService.getAllArticles(true);

      if (existingArticles.length > 0) {
        console.log(`Found ${existingArticles.length} existing articles, skipping seed`);
        return;
      }

      // Insert default articles
      console.log(`Seeding ${defaultArticles.length} default articles...`);

      for (const article of defaultArticles) {
        await databaseService.upsertArticle({
          ...article,
          likes: article.likes || 0,
          views: article.views || 0,
          isPublished: article.isPublished !== undefined ? article.isPublished : true,
          isFeatured: article.isFeatured || false,
          version: 0,
          createdAt: article.createdAt || new Date().toISOString(),
          updatedAt: article.updatedAt || new Date().toISOString(),
        });
      }

      console.log(`Seeded ${defaultArticles.length} default articles`);
    } catch (error) {
      console.error('Error seeding articles:', error);
      throw error;
    }
  }

  /**
   * Force reseed (clear and reseed all default data)
   */
  async forceReseed(): Promise<void> {
    try {
      console.log('Force reseeding default data...');

      // Reset seed flag
      await databaseService.setSyncMetadata(SEED_FLAG_KEY, 'false');

      // Reseed
      await this.seedDefaultData();

      console.log('Force reseed completed');
    } catch (error) {
      console.error('Error force reseeding:', error);
      throw error;
    }
  }

  /**
   * Check if data has been seeded
   */
  async hasBeenSeeded(): Promise<boolean> {
    const hasSeeded = await databaseService.getSyncMetadata(SEED_FLAG_KEY);
    return hasSeeded === 'true';
  }
}

// Export singleton instance
export const dataSeedService = new DataSeedService();
