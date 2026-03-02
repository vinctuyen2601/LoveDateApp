/**
 * Analytics Service — Firebase Analytics wrapper
 * Gracefully no-ops when Firebase is unavailable (Expo Go / dev without custom build)
 */

import type { FirebaseAnalyticsTypes } from '@react-native-firebase/analytics';

let _analytics: FirebaseAnalyticsTypes.Module | null = null;

const getAnalytics = (): FirebaseAnalyticsTypes.Module | null => {
  if (_analytics) return _analytics;
  try {
    // Dynamic import so it doesn't crash in Expo Go
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: analytics } = require('@react-native-firebase/analytics');
    _analytics = analytics();
    return _analytics;
  } catch {
    return null;
  }
};

// ─── Screen tracking ──────────────────────────────────────────────────────────

export const logScreenView = (screenName: string, screenClass?: string) => {
  getAnalytics()
    ?.logScreenView({ screen_name: screenName, screen_class: screenClass ?? screenName })
    .catch(() => {});
};

// ─── Article events ───────────────────────────────────────────────────────────

export const logArticleView = (params: { id: string; title: string; category: string }) => {
  getAnalytics()
    ?.logEvent('article_view', {
      article_id: params.id,
      article_title: params.title.slice(0, 100),
      article_category: params.category,
    })
    .catch(() => {});
};

export const logArticleShare = (params: { id: string; title: string }) => {
  getAnalytics()
    ?.logShare({
      content_type: 'article',
      item_id: params.id,
      method: 'native_share',
    })
    .catch(() => {});
};

// ─── Gift survey events ───────────────────────────────────────────────────────

export const logGiftSurveyStart = () => {
  getAnalytics()
    ?.logEvent('gift_survey_start', {})
    .catch(() => {});
};

export const logGiftSurveyComplete = (params: { occasion?: string; budget?: string }) => {
  getAnalytics()
    ?.logEvent('gift_survey_complete', {
      occasion: params.occasion ?? 'unknown',
      budget: params.budget ?? 'unknown',
    })
    .catch(() => {});
};

// ─── Product / gift events ────────────────────────────────────────────────────

export const logProductView = (params: { id: string; name: string; category?: string; price?: number }) => {
  getAnalytics()
    ?.logViewItem({
      items: [
        {
          item_id: params.id,
          item_name: params.name.slice(0, 100),
          item_category: params.category,
          price: params.price,
        },
      ],
    })
    .catch(() => {});
};

export const logProductClick = (params: { id: string; name: string; affiliateUrl: string }) => {
  getAnalytics()
    ?.logEvent('affiliate_click', {
      product_id: params.id,
      product_name: params.name.slice(0, 100),
      affiliate_url: params.affiliateUrl.slice(0, 200),
    })
    .catch(() => {});
};

// ─── Event (calendar) events ──────────────────────────────────────────────────

export const logEventCreate = (category: string) => {
  getAnalytics()
    ?.logEvent('calendar_event_create', { category })
    .catch(() => {});
};

// ─── Auth events ──────────────────────────────────────────────────────────────

export const logLogin = (method: string) => {
  getAnalytics()?.logLogin({ method }).catch(() => {});
};

export const logSignUp = (method: string) => {
  getAnalytics()?.logSignUp({ method }).catch(() => {});
};
