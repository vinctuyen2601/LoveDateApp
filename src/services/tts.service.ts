/**
 * tts.service.ts
 * Text-to-Speech — pluggable provider.
 *
 * Provider selection (evaluated in order):
 *   1. CMS flag `enableGoogleTts` = false  → always "native"
 *   2. Within 3-day install trial           → "google"
 *   3. User is premium                      → "google"
 *   4. Otherwise                            → "native"
 *
 * "native"  — expo-speech (OS TTS, free, offline, Android vi-VN ok)
 * "google"  — Google Cloud TTS WaveNet vi-VN (requires EXPO_PUBLIC_GOOGLE_TTS_KEY)
 *
 * Usage:
 *   await TTS.speak("Đã lưu sinh nhật vợ ngày 5 tháng 3", userId);
 *   TTS.stop();
 *
 *   // Call once at app startup to record install date:
 *   await TTS.initInstallDate();
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { AudioPlayer, createAudioPlayer } from "expo-audio";
import * as FileSystem from "expo-file-system";
import { isPremiumUser } from "./premium.service";
import { isGoogleTtsEnabled } from "./remoteConfig.service";
import { REMOTE_CONFIG, STORAGE_KEYS } from "../constants/config";

// ─── Types ────────────────────────────────────────────────────────────────────

type TTSProvider = "native" | "google";

// ─── Install-date trial ───────────────────────────────────────────────────────

/**
 * Call once at app startup (e.g. App.tsx useEffect).
 * Records the first-open date if not already set.
 */
export async function initInstallDate(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_INSTALL_DATE);
    if (!existing) {
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_INSTALL_DATE, new Date().toISOString());
    }
  } catch {
    // Non-critical
  }
}

async function isWithinInstallTrial(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_INSTALL_DATE);
    if (!raw) return true; // First run before initInstallDate() was called → assume trial
    const installDate = new Date(raw).getTime();
    const daysSince = (Date.now() - installDate) / (1000 * 60 * 60 * 24);
    return daysSince < REMOTE_CONFIG.GOOGLE_TTS_TRIAL_DAYS;
  } catch {
    return false;
  }
}

// ─── Provider resolution ──────────────────────────────────────────────────────

async function resolveProvider(userId?: string): Promise<TTSProvider> {
  // 1. CMS master switch — if disabled, always use native
  const googleEnabled = await isGoogleTtsEnabled();
  if (!googleEnabled) return "native";

  // 2. 3-day install trial
  if (await isWithinInstallTrial()) return "google";

  // 3. Premium user
  if (userId && (await isPremiumUser(userId))) return "google";

  return "native";
}

// ─── Native provider (expo-speech) ───────────────────────────────────────────

function speakNative(text: string): void {
  Speech.speak(text, {
    language: "vi-VN",
    pitch: 1.0,
    rate: 0.95,
  });
}

function stopNative(): void {
  Speech.stop();
}

// ─── Google Cloud TTS provider ────────────────────────────────────────────────

// Track the current player so we can stop it
let _currentPlayer: AudioPlayer | null = null;

async function speakGoogle(text: string): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_TTS_KEY;
  if (!apiKey) {
    // Key not configured — fall back to native silently
    speakNative(text);
    return;
  }

  const body = {
    input: { text },
    voice: {
      languageCode: "vi-VN",
      // Neural2-D = female, Neural2-A = male
      name: "vi-VN-Neural2-D",
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 0.95,
      pitch: 0,
    },
  };

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Google TTS error ${res.status}`);
  const json = await res.json();
  const base64Audio: string = json.audioContent;

  // Write to temp file and play
  const tempUri = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(tempUri, base64Audio, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Stop any previous player
  _currentPlayer?.remove();
  _currentPlayer = null;

  const player = createAudioPlayer({ uri: tempUri });
  _currentPlayer = player;
  player.play();

  // Auto-cleanup when playback finishes
  const sub = player.addListener("playbackStatusUpdate", (status) => {
    if (status.didJustFinish) {
      sub.remove();
      player.remove();
      if (_currentPlayer === player) _currentPlayer = null;
      FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});
    }
  });
}

function stopGoogle(): void {
  _currentPlayer?.remove();
  _currentPlayer = null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Speak text using the appropriate provider for this user.
 * Falls back to native on any error.
 *
 * @param text    Vietnamese text to speak
 * @param userId  Current user ID for premium check (optional)
 */
export async function speak(text: string, userId?: string): Promise<void> {
  const provider = await resolveProvider(userId);
  try {
    if (provider === "google") {
      await speakGoogle(text);
    } else {
      speakNative(text);
    }
  } catch {
    // Google failed — fall back to native
    speakNative(text);
  }
}

/**
 * Stop any currently playing speech.
 */
export function stop(): void {
  stopNative();
  stopGoogle();
}
