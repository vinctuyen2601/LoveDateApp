/**
 * Affiliate Product Service
 * Handles all affiliate product-related API calls, caching, and tracking
 * Follows the same cache-first pattern as articleService.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AffiliateProduct, AffiliateCategory } from '../types';
import { DEFAULT_AFFILIATE_PRODUCTS } from '../data/affiliateProducts';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const PRODUCTS_CACHE_KEY = '@lovedate_affiliate_products_cache';
const PRODUCTS_CACHE_TIMESTAMP_KEY = '@lovedate_affiliate_products_cache_timestamp';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Fetch products from backend API
 */
export const fetchProductsFromAPI = async (): Promise<AffiliateProduct[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/affiliate-products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.products || data; // Handle different response formats
  } catch (error) {
    console.error('Error fetching products from API:', error);
    throw error;
  }
};

/**
 * Get products with cache-first strategy
 * 1. Check cache validity
 * 2. If valid, return cached data and fetch fresh in background
 * 3. If invalid or no cache, fetch from API
 * 4. If API fails, return default products
 */
export const getProducts = async (): Promise<AffiliateProduct[]> => {
  try {
    // Check cache first
    const cachedProducts = await getCachedProducts();
    if (cachedProducts) {
      // Fetch fresh data in background for next time
      fetchProductsFromAPI()
        .then(products => cacheProducts(products))
        .catch(err => console.log('Background product fetch failed:', err));

      return cachedProducts;
    }

    // No valid cache, fetch from API
    const products = await fetchProductsFromAPI();
    await cacheProducts(products);
    return products;
  } catch (error) {
    console.error('Error getting products, using defaults:', error);
    return DEFAULT_AFFILIATE_PRODUCTS;
  }
};

/**
 * Get cached products if still valid
 */
const getCachedProducts = async (): Promise<AffiliateProduct[] | null> => {
  try {
    const [cachedData, cachedTimestamp] = await Promise.all([
      AsyncStorage.getItem(PRODUCTS_CACHE_KEY),
      AsyncStorage.getItem(PRODUCTS_CACHE_TIMESTAMP_KEY),
    ]);

    if (!cachedData || !cachedTimestamp) {
      return null;
    }

    const timestamp = parseInt(cachedTimestamp, 10);
    const now = Date.now();

    if (now - timestamp > CACHE_DURATION) {
      return null;
    }

    return JSON.parse(cachedData);
  } catch (error) {
    console.error('Error reading cached products:', error);
    return null;
  }
};

/**
 * Cache products to local storage
 */
const cacheProducts = async (products: AffiliateProduct[]): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products)),
      AsyncStorage.setItem(PRODUCTS_CACHE_TIMESTAMP_KEY, Date.now().toString()),
    ]);
  } catch (error) {
    console.error('Error caching products:', error);
  }
};

/**
 * Force refresh products from API
 */
export const refreshProducts = async (): Promise<AffiliateProduct[]> => {
  try {
    const products = await fetchProductsFromAPI();
    await cacheProducts(products);
    return products;
  } catch (error) {
    console.error('Error refreshing products:', error);
    throw error;
  }
};

/**
 * Clear products cache
 */
export const clearProductsCache = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(PRODUCTS_CACHE_KEY),
      AsyncStorage.removeItem(PRODUCTS_CACHE_TIMESTAMP_KEY),
    ]);
  } catch (error) {
    console.error('Error clearing products cache:', error);
  }
};

/**
 * Track product view (analytics - fire and forget)
 */
export const trackProductView = async (productId: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/affiliate-products/${productId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Fail silently for analytics
  }
};

/**
 * Track affiliate click (revenue tracking - fire and forget)
 */
export const trackAffiliateClick = async (productId: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/affiliate-products/${productId}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Fail silently for analytics
  }
};

/**
 * Get product by ID from cache
 */
export const getProductById = async (productId: string): Promise<AffiliateProduct | null> => {
  try {
    const products = await getProducts();
    return products.find(p => p.id === productId) || null;
  } catch (error) {
    return null;
  }
};

// ==================== ASYNC FILTER HELPERS ====================

/**
 * Get products by category (async)
 */
export const getProductsByCategory = async (category: AffiliateCategory): Promise<AffiliateProduct[]> => {
  const products = await getProducts();
  return products.filter(p => p.category === category);
};

/**
 * Get products by budget range (async)
 */
export const getProductsByBudget = async (budget: string): Promise<AffiliateProduct[]> => {
  const products = await getProducts();
  return products.filter(p => p.budget?.includes(budget));
};

/**
 * Get products by occasion (async)
 */
export const getProductsByOccasion = async (occasion: string): Promise<AffiliateProduct[]> => {
  const products = await getProducts();
  return products.filter(p => p.occasion?.includes(occasion));
};

/**
 * Get popular products (async)
 */
export const getPopularProductsAsync = async (limit: number = 8): Promise<AffiliateProduct[]> => {
  const products = await getProducts();
  return products
    .filter(p => p.isPopular)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

/**
 * Get related products for article (async)
 */
export const getRelatedProductsForArticleAsync = async (articleTags?: string[]): Promise<AffiliateProduct[]> => {
  const products = await getProducts();
  if (!articleTags || articleTags.length === 0) {
    return products.filter(p => p.isPopular).slice(0, 4);
  }
  const tagged = products.filter(
    p =>
      p.occasion?.some(o => articleTags.includes(o)) ||
      p.tags?.some(t => articleTags.includes(t))
  );
  if (tagged.length >= 3) return tagged.slice(0, 4);
  return products.filter(p => p.isPopular).slice(0, 4);
};
