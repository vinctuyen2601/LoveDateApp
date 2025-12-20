/**
 * Article Service
 * Handles all article-related API calls and data synchronization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article, DEFAULT_ARTICLES } from '../data/articles';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const ARTICLES_CACHE_KEY = '@lovedate_articles_cache';
const ARTICLES_CACHE_TIMESTAMP_KEY = '@lovedate_articles_cache_timestamp';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Fetch articles from backend API
 */
export const fetchArticlesFromAPI = async (): Promise<Article[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/articles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.articles || data; // Handle different response formats
  } catch (error) {
    console.error('Error fetching articles from API:', error);
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
 * Track article view (analytics)
 */
export const trackArticleView = async (articleId: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/articles/${articleId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error tracking article view:', error);
    // Fail silently for analytics
  }
};

/**
 * Track article like
 */
export const likeArticle = async (articleId: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/articles/${articleId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error liking article:', error);
    throw error;
  }
};

/**
 * Unlike article
 */
export const unlikeArticle = async (articleId: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/articles/${articleId}/unlike`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
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
 * Sync local changes to backend (for future admin features)
 */
export const syncArticle = async (article: Article): Promise<Article> => {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/${article.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const updatedArticle = await response.json();

    // Update cache
    await clearArticlesCache();

    return updatedArticle;
  } catch (error) {
    console.error('Error syncing article:', error);
    throw error;
  }
};
