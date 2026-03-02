/**
 * Article Service
 * Handles all article-related API calls and data synchronization
 * Updated for CMS integration with version-based sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article, DEFAULT_ARTICLES } from '../data/articles';
import { CACHE_CONFIG, STORAGE_KEYS } from '../constants/config';
import { apiService } from './api.service';

const ARTICLES_CACHE_KEY = STORAGE_KEYS.ARTICLES_CACHE;
const ARTICLES_CACHE_TIMESTAMP_KEY = STORAGE_KEYS.ARTICLES_TIMESTAMP;
const CACHE_DURATION = CACHE_CONFIG.DURATION;

/**
 * Fetch articles from CMS backend API
 */
export const fetchArticlesFromAPI = async (): Promise<Article[]> => {
  try {
    const data = await apiService.get('/articles');
    const articles = (data.articles || data) as Article[];
    return articles.filter((article) => article.status !== 'draft' && article.status !== 'archived');
  } catch (error) {
    console.error('Error fetching articles from CMS:', error);
    throw error;
  }
};

/**
 * Get articles with cache-first strategy
 * 1. Check cache validity
 * 2. If valid, return cached data
 * 3. If invalid or no cache, fetch from API
 * 4. If API fails, return default articles
 */
export const getArticles = async (): Promise<Article[]> => {
  try {
    // Check cache first
    const cachedArticles = await getCachedArticles();
    if (cachedArticles) {
      console.log('Using cached articles');

      // Fetch fresh data in background for next time
      fetchArticlesFromAPI()
        .then(articles => cacheArticles(articles))
        .catch(err => console.log('Background fetch failed:', err));

      return cachedArticles;
    }

    // No valid cache, fetch from API
    console.log('Fetching articles from API');
    const articles = await fetchArticlesFromAPI();
    await cacheArticles(articles);
    return articles;
  } catch (error) {
    console.error('Error getting articles, using defaults:', error);
    // Fallback to default articles
    return DEFAULT_ARTICLES;
  }
};

/**
 * Get cached articles if still valid
 */
const getCachedArticles = async (): Promise<Article[] | null> => {
  try {
    const [cachedData, cachedTimestamp] = await Promise.all([
      AsyncStorage.getItem(ARTICLES_CACHE_KEY),
      AsyncStorage.getItem(ARTICLES_CACHE_TIMESTAMP_KEY),
    ]);

    if (!cachedData || !cachedTimestamp) {
      return null;
    }

    const timestamp = parseInt(cachedTimestamp, 10);
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp > CACHE_DURATION) {
      console.log('Cache expired');
      return null;
    }

    return JSON.parse(cachedData);
  } catch (error) {
    console.error('Error reading cached articles:', error);
    return null;
  }
};

/**
 * Cache articles to local storage
 */
const cacheArticles = async (articles: Article[]): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.setItem(ARTICLES_CACHE_KEY, JSON.stringify(articles)),
      AsyncStorage.setItem(ARTICLES_CACHE_TIMESTAMP_KEY, Date.now().toString()),
    ]);
    console.log('Articles cached successfully');
  } catch (error) {
    console.error('Error caching articles:', error);
  }
};

/**
 * Force refresh articles from API
 */
export const refreshArticles = async (): Promise<Article[]> => {
  try {
    const articles = await fetchArticlesFromAPI();
    await cacheArticles(articles);
    return articles;
  } catch (error) {
    console.error('Error refreshing articles:', error);
    throw error;
  }
};

/**
 * Clear articles cache
 */
export const clearArticlesCache = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(ARTICLES_CACHE_KEY),
      AsyncStorage.removeItem(ARTICLES_CACHE_TIMESTAMP_KEY),
    ]);
    console.log('Articles cache cleared');
  } catch (error) {
    console.error('Error clearing articles cache:', error);
  }
};

/**
 * Track article view (analytics - CMS endpoint)
 */
export const trackArticleView = async (articleId: string): Promise<void> => {
  try {
    await apiService.post(`/articles/${articleId}/view`);
  } catch (error) {
    console.error('Error tracking article view:', error);
    // Fail silently for analytics
  }
};

/**
 * Track article like (CMS endpoint)
 */
export const likeArticle = async (articleId: string): Promise<void> => {
  try {
    await apiService.post(`/articles/${articleId}/like`);
  } catch (error) {
    console.error('Error liking article:', error);
    throw error;
  }
};

/**
 * Unlike article (CMS endpoint)
 */
export const unlikeArticle = async (articleId: string): Promise<void> => {
  try {
    await apiService.post(`/articles/${articleId}/unlike`);
  } catch (error) {
    console.error('Error unliking article:', error);
    throw error;
  }
};

/**
 * Get article by ID
 */
export const getArticleById = async (articleId: string): Promise<Article | null> => {
  try {
    const articles = await getArticles();
    return articles.find(article => article.id === articleId) || null;
  } catch (error) {
    console.error('Error getting article by ID:', error);
    return null;
  }
};

/**
 * Gợi ý bài viết dựa trên kết quả khảo sát qua AI
 * Flow: surveyResult → POST /articles/ai-suggest → AI trả articleIds → map sang Article[]
 */
export const suggestArticlesForSurvey = async (
  surveyType: 'personality' | 'mbti',
  surveyResult: Record<string, any>,
): Promise<Article[]> => {
  try {
    const data = await apiService.post('/articles/ai-suggest', { surveyType, surveyResult });
    const articleIds: string[] = data.articleIds ?? [];
    if (articleIds.length === 0) throw new Error('no ids');

    // Map từ cache (đã có sẵn) theo thứ tự AI trả về
    const allArticles = await getArticles();
    const byId = new Map(allArticles.map(a => [a.id, a]));
    return articleIds.map(id => byId.get(id)).filter((a): a is Article => !!a);
  } catch {
    // Fallback: lọc client-side từ cache
    const allArticles = await getArticles();
    return allArticles
      .filter(a => a.category === 'personality' || a.category === 'communication')
      .slice(0, 4);
  }
};

/**
 * Sync local changes to backend (for future admin features)
 */
export const syncArticle = async (article: Article): Promise<Article> => {
  try {
    const updatedArticle = await apiService.put(`/articles/${article.id}`, article);

    // Update cache
    await clearArticlesCache();

    return updatedArticle;
  } catch (error) {
    console.error('Error syncing article:', error);
    throw error;
  }
};
