/**
 * remoteConfig.service.ts
 *
 * Fetches feature flags from the CMS backend and caches them in AsyncStorage.
 * Falls back to local FEATURES defaults if the network is unavailable.
 *
 * Cache TTL: 30 minutes (REMOTE_CONFIG.CACHE_TTL_MS)
 *
 * Backend endpoint: GET /api/site-config/feature_flags
 * Managed via site-config key "feature_flags" (group: "app").
 * CMS admin can toggle flags without releasing a new app version.
 *
 * Expected response shape (value of the site-config key):
 *   { "enableGoogleTts": true }
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, FEATURES, REMOTE_CONFIG, STORAGE_KEYS } from "../constants/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RemoteFeatureFlags {
  /** Allow Google Cloud TTS for premium users + install trial */
  enableGoogleTts: boolean;
}

// Local defaults — used when fetch fails or cache is cold
const LOCAL_DEFAULTS: RemoteFeatureFlags = {
  enableGoogleTts: FEATURES.ENABLE_GOOGLE_TTS,
};

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function readCache(): Promise<RemoteFeatureFlags | null> {
  try {
    const [raw, tsRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.REMOTE_FEATURES_CACHE),
      AsyncStorage.getItem(STORAGE_KEYS.REMOTE_FEATURES_TIMESTAMP),
    ]);
    if (!raw || !tsRaw) return null;
    const age = Date.now() - parseInt(tsRaw, 10);
    if (age > REMOTE_CONFIG.CACHE_TTL_MS) return null;
    return JSON.parse(raw) as RemoteFeatureFlags;
  } catch {
    return null;
  }
}

async function writeCache(flags: RemoteFeatureFlags): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.REMOTE_FEATURES_CACHE, JSON.stringify(flags)),
      AsyncStorage.setItem(STORAGE_KEYS.REMOTE_FEATURES_TIMESTAMP, String(Date.now())),
    ]);
  } catch {
    // Non-critical — next call will just re-fetch
  }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchFromServer(): Promise<RemoteFeatureFlags> {
  // GET /api/site-config/feature_flags returns the `value` field directly
  const res = await fetch(`${API_BASE_URL}/site-config/feature_flags`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Remote config fetch failed: ${res.status}`);
  const json = await res.json();
  // Map server response → typed flags (unknown keys are ignored)
  return {
    enableGoogleTts: json.enableGoogleTts ?? LOCAL_DEFAULTS.enableGoogleTts,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get remote feature flags.
 * Serves from cache if fresh; falls back to local defaults on error.
 */
export async function getRemoteFeatures(): Promise<RemoteFeatureFlags> {
  const cached = await readCache();
  if (cached) return cached;

  try {
    const flags = await fetchFromServer();
    await writeCache(flags);
    return flags;
  } catch {
    // Network unavailable — use local defaults, don't cache so we retry next time
    return LOCAL_DEFAULTS;
  }
}

/**
 * Convenience helper — check the single flag used by tts.service.
 */
export async function isGoogleTtsEnabled(): Promise<boolean> {
  const flags = await getRemoteFeatures();
  return flags.enableGoogleTts;
}

/**
 * Force-invalidate the cache (e.g. after CMS push or app foreground).
 */
export async function invalidateRemoteConfig(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.REMOTE_FEATURES_CACHE),
      AsyncStorage.removeItem(STORAGE_KEYS.REMOTE_FEATURES_TIMESTAMP),
    ]);
  } catch {
    // ignore
  }
}
