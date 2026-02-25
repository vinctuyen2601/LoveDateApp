import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { OCCASION_OPTIONS, SERVICE_CATEGORIES } from '../data/affiliateProducts';
import { apiService } from '../services/api.service';
import { saveMasterDataCache, loadMasterDataCache } from '../services/database.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DynamicOccasion = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type DynamicCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

type MasterDataContextValue = {
  occasions: DynamicOccasion[];
  productCategories: DynamicCategory[];
};

// ─── Visual maps (color + icon — frontend-only, won't change often) ───────────

const OCCASION_VISUAL: Record<string, { icon: string; color: string }> = {
  birthday:        { icon: 'gift',         color: '#FF6B6B' },
  valentine:       { icon: 'heart',        color: '#E91E63' },
  women_day_8_3:   { icon: 'flower',       color: '#FF69B4' },
  women_day_20_10: { icon: 'rose',         color: '#C62828' },
  christmas:       { icon: 'snow',         color: '#4CAF50' },
  anniversary:     { icon: 'heart-circle', color: '#9C27B0' },
  apology:         { icon: 'sad',          color: '#607D8B' },
};

const CATEGORY_VISUAL: Record<string, { icon: string; color: string }> = {
  gift:       { icon: 'gift-outline',       color: '#FF6B6B' },
  restaurant: { icon: 'restaurant-outline', color: '#FF8C00' },
  hotel:      { icon: 'bed-outline',        color: '#9B59B6' },
  spa:        { icon: 'leaf-outline',       color: '#2ECC71' },
  travel:     { icon: 'airplane-outline',   color: '#3498DB' },
};

// ─── Hardcoded fallback (used only if SQLite cache is also empty) ─────────────

const FALLBACK_OCCASIONS: DynamicOccasion[] = OCCASION_OPTIONS.map((o) => ({
  id: o.id,
  name: o.name,
  icon: o.icon,
  color: o.color,
}));

const FALLBACK_CATEGORIES: DynamicCategory[] = SERVICE_CATEGORIES.map((c) => ({
  id: c.id,
  name: c.name,
  icon: c.icon,
  color: c.color,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeOccasions(raw: { id: string; label: string; value: string }[]): DynamicOccasion[] {
  return raw.map((item) => ({
    id: item.value,
    name: item.label,
    icon: OCCASION_VISUAL[item.value]?.icon ?? 'star',
    color: OCCASION_VISUAL[item.value]?.color ?? '#888888',
  }));
}

function mergeCategories(raw: { id: string; label: string; value: string }[]): DynamicCategory[] {
  return raw.map((item) => ({
    id: item.value,
    name: item.label,
    icon: CATEGORY_VISUAL[item.value]?.icon ?? 'grid-outline',
    color: CATEGORY_VISUAL[item.value]?.color ?? '#888888',
  }));
}

// ─── Context ──────────────────────────────────────────────────────────────────

const MasterDataContext = createContext<MasterDataContextValue>({
  occasions: FALLBACK_OCCASIONS,
  productCategories: FALLBACK_CATEGORIES,
});

export function MasterDataProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [occasions, setOccasions] = useState<DynamicOccasion[]>(FALLBACK_OCCASIONS);
  const [productCategories, setProductCategories] = useState<DynamicCategory[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    const load = async () => {
      // 1. Load from SQLite cache first (instant, works offline)
      const [cachedOccasions, cachedCategories] = await Promise.all([
        loadMasterDataCache<{ id: string; label: string; value: string }>(db, 'occasions'),
        loadMasterDataCache<{ id: string; label: string; value: string }>(db, 'productCategories'),
      ]);

      if (cachedOccasions && cachedOccasions.length > 0) {
        setOccasions(mergeOccasions(cachedOccasions));
      }
      if (cachedCategories && cachedCategories.length > 0) {
        setProductCategories(mergeCategories(cachedCategories));
      }

      // 2. Fetch from API and update cache
      try {
        const response = await apiService.get<{
          occasions: { id: string; label: string; value: string }[];
          productCategories: { id: string; label: string; value: string }[];
        }>('/master-data');

        const data = response.data;

        if (data.occasions?.length > 0) {
          setOccasions(mergeOccasions(data.occasions));
          await saveMasterDataCache(db, 'occasions', data.occasions);
        }

        if (data.productCategories?.length > 0) {
          setProductCategories(mergeCategories(data.productCategories));
          await saveMasterDataCache(db, 'productCategories', data.productCategories);
        }
      } catch {
        // API unavailable — keep SQLite cache or hardcoded fallback
      }
    };

    load();
  }, [db]);

  return (
    <MasterDataContext.Provider value={{ occasions, productCategories }}>
      {children}
    </MasterDataContext.Provider>
  );
}

export const useMasterData = () => useContext(MasterDataContext);
