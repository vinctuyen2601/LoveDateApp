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

// ==================== DEDICATED SECTION APIs ====================

export const getTrendingProducts = async (limit: number = 8): Promise<AffiliateProduct[]> => {
  const data = await apiService.get(`/products/trending`, { params: { limit } });
  return (data.products || data) as AffiliateProduct[];
};

export const getProductsByOccasion = async (occasionId: string, limit: number = 20): Promise<AffiliateProduct[]> => {
  const data = await apiService.get(`/products/by-occasion/${occasionId}`, { params: { limit } });
  return (data.products || data) as AffiliateProduct[];
};

export const getProductsByBudget = async (budgetRange: string, limit: number = 3): Promise<AffiliateProduct[]> => {
  const data = await apiService.get(`/products/by-budget/${encodeURIComponent(budgetRange)}`, { params: { limit } });
  return (data.products || data) as AffiliateProduct[];
};

export const getExperienceProducts = async (limit: number = 10): Promise<AffiliateProduct[]> => {
  const data = await apiService.get(`/products/experiences`, { params: { limit } });
  return (data.products || data) as AffiliateProduct[];
};

// ==================== FILTER HELPERS (client-side, dùng cho các nơi khác) ====================

export const getProductById = async (productId: string): Promise<AffiliateProduct | null> => {
  const products = await getProducts();
  return products.find(p => p.id === productId) || null;
};

export const getProductsByCategory = async (category: AffiliateCategory): Promise<AffiliateProduct[]> => {
  const products = await getProducts();
  return products.filter(p => p.category === category);
};

export const getPopularProductsAsync = async (limit: number = 8): Promise<AffiliateProduct[]> => {
  return getTrendingProducts(limit);
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

// ==================== PAGINATED API (for AllProductsScreen + OccasionProductsScreen infinite scroll) ====================

export interface ProductPageParams {
  page: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  occasion?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProductPageResponse {
  data: AffiliateProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch paginated products using the /products/search endpoint (already supports full pagination).
 * Used for AllProductsScreen with infinite scroll.
 */
export const fetchProductsPaginated = async (params: ProductPageParams): Promise<ProductPageResponse> => {
  const queryParams: Record<string, string | number> = {
    page: params.page,
    limit: params.limit ?? 12,
  };
  if (params.search?.trim()) queryParams.search = params.search.trim();
  if (params.category) queryParams.category = params.category;
  if (params.minPrice != null) queryParams.minPrice = params.minPrice;
  if (params.maxPrice != null) queryParams.maxPrice = params.maxPrice;
  if (params.occasion) queryParams.occasion = params.occasion;
  if (params.sortBy) queryParams.sortBy = params.sortBy;
  if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

  const data = await apiService.get('/products/search', { params: queryParams });
  if (Array.isArray(data)) {
    return { data, total: data.length, page: 1, limit: data.length, totalPages: 1 };
  }
  return data as ProductPageResponse;
};

/**
 * Fetch paginated products filtered by occasion.
 * Supports full filter/sort params, delegates to fetchProductsPaginated.
 */
export const fetchProductsByOccasionPaginated = async (
  occasionId: string,
  params: Omit<ProductPageParams, 'occasion'>,
): Promise<ProductPageResponse> => {
  return fetchProductsPaginated({ ...params, occasion: occasionId });
};
