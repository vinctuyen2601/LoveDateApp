/**
 * feedback.service.ts
 * Haptic + vibration feedback for key UI moments.
 *
 * Uses expo-haptics on iOS (rich patterns) with Vibration fallback on Android.
 *
 * Usage:
 *   Feedback.recordStart()   // mic pressed
 *   Feedback.recordStop()    // mic released
 *   Feedback.success()       // event saved
 *   Feedback.error()         // something went wrong
 *   Feedback.select()        // chip / item tapped
 */

import { Platform, Vibration } from "react-native";
import * as Haptics from "expo-haptics";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function impact(style: Haptics.ImpactFeedbackStyle) {
  try {
    await Haptics.impactAsync(style);
  } catch {
    // expo-haptics unavailable (simulator / old device) — silent fail
  }
}

async function notification(type: Haptics.NotificationFeedbackType) {
  try {
    await Haptics.notificationAsync(type);
  } catch {
    // fallback to vibration
    const patterns: Record<Haptics.NotificationFeedbackType, number | number[]> = {
      [Haptics.NotificationFeedbackType.Success]: [0, 40, 60, 40],
      [Haptics.NotificationFeedbackType.Warning]: [0, 80, 50, 80],
      [Haptics.NotificationFeedbackType.Error]:   [0, 100, 50, 100],
    };
    Vibration.vibrate(patterns[type] ?? 50);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Mic button pressed — recording starts */
export function recordStart() {
  if (Platform.OS === "ios") {
    impact(Haptics.ImpactFeedbackStyle.Medium);
  } else {
    Vibration.vibrate(40);
  }
}

/** Mic released — recording stops */
export function recordStop() {
  if (Platform.OS === "ios") {
    impact(Haptics.ImpactFeedbackStyle.Light);
  } else {
    Vibration.vibrate([0, 25, 40, 25]);
  }
}

/** Event saved successfully */
export function success() {
  notification(Haptics.NotificationFeedbackType.Success);
}

/** Operation failed */
export function error() {
  notification(Haptics.NotificationFeedbackType.Error);
}

/** Light tap — chip selected, card toggled */
export function select() {
  if (Platform.OS === "ios") {
    impact(Haptics.ImpactFeedbackStyle.Light);
  } else {
    Vibration.vibrate(20);
  }
}

/** State transition — e.g. moving to CONFIRM screen */
export function transition() {
  if (Platform.OS === "ios") {
    impact(Haptics.ImpactFeedbackStyle.Rigid);
  } else {
    Vibration.vibrate(30);
  }
}
