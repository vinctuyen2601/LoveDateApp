/**
 * Affiliate Product Service
 * Realtime fetch from CMS backend — no cache, no fallback.
 * If no network → caller receives thrown error → UI shows empty state.
 */

import { AffiliateProduct, AffiliateCategory } from '../types';
import { apiService } from './api.service';

/**
 * Fetch products directly from CMS backend (realtime, no cache)
 */
export const getProducts = async (): Promise<AffiliateProduct[]> => {
  const data = await apiService.get('/products');
  const products = (data.products || data) as AffiliateProduct[];
  return products.filter(p => p.status !== 'draft' && p.status !== 'archived');
};

/**
 * Track product view (analytics — fire and forget)
 */
export const trackProductView = async (productId: string): Promise<void> => {
  try {
    await apiService.post(`/products/${productId}/view`);
  } catch {
    // Fail silently for analytics
  }
};

/**
 * Track affiliate click (revenue tracking — fire and forget)
 */
export const trackAffiliateClick = async (productId: string): Promise<void> => {
  try {
    await apiService.post(`/products/${productId}/click`);
  } catch {
    // Fail silently for analytics
  }
};

// ==================== FILTER HELPERS ====================

export const getProductById = async (productId: string): Promise<AffiliateProduct | null> => {
  const products = await getProducts();
  return products.find(p => p.id === productId) || null;
};

export const getProductsByCategory = async (category: AffiliateCategory): Promise<AffiliateProduct[]> => {
  const products = await getProducts();
  return products.filter(p => p.category === category);
};

export const getProductsByBudget = async (budget: string): Promise<AffiliateProduct[]> => {
  const products = await getProducts();
  return products.filter(p => p.budget?.includes(budget));
};

export const getProductsByOccasion = async (occasion: string): Promise<AffiliateProduct[]> => {
  const products = await getProducts();
  return products.filter(p => p.occasion?.includes(occasion));
};

export const getPopularProductsAsync = async (limit: number = 8): Promise<AffiliateProduct[]> => {
  const products = await getProducts();
  return products
    .filter(p => p.isPopular)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

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
  return tagged.length >= 3 ? tagged.slice(0, 4) : products.filter(p => p.isPopular).slice(0, 4);
};
