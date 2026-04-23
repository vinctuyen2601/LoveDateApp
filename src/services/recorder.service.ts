/**
 * recorder.service.ts
 * Wraps expo-audio AudioRecorder with a simple start/stop API.
 * Returns the local audio file URI on stop.
 */

import { AudioModule, RecordingPresets } from "expo-audio";
import type { AudioRecorder } from "expo-audio";
import { Platform } from "react-native";

let _recorder: AudioRecorder | null = null;

/** Request microphone permission. Returns true if granted. */
export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { granted } = await AudioModule.requestRecordingPermissionsAsync();
  return granted;
}

/** Start recording. Throws if permission denied or already recording. */
export async function startRecording(): Promise<void> {
  if (_recorder) {
    await stopRecording();
  }

  if (Platform.OS === 'ios') {
    try {
      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    } catch (e: any) {
      throw new Error(`[S2-setAudioMode] ${e?.message ?? e}`);
    }
  }

  const preset = RecordingPresets.HIGH_QUALITY;
  const platformOptions = {
    extension: preset.extension,
    sampleRate: preset.sampleRate,
    numberOfChannels: preset.numberOfChannels,
    bitRate: preset.bitRate,
    isMeteringEnabled: false,
    ...(Platform.OS === 'ios' ? preset.ios : preset.android),
  };

  try {
    _recorder = new AudioModule.AudioRecorder(platformOptions);
  } catch (e: any) {
    throw new Error(`[S3-new AudioRecorder] ${e?.message ?? e}`);
  }

  try {
    await _recorder.prepareToRecordAsync();
  } catch (e: any) {
    throw new Error(`[S4-prepareToRecordAsync] ${e?.message ?? e}`);
  }

  try {
    _recorder.record();
  } catch (e: any) {
    throw new Error(`[S5-record] ${e?.message ?? e}`);
  }
}

/**
 * Stop recording and return the local file URI.
 * Returns null if no recording was active.
 */
export async function stopRecording(): Promise<string | null> {
  if (!_recorder) return null;

  try {
    await _recorder.stop();
    const uri = _recorder.uri;
    _recorder.release();
    _recorder = null;

    if (Platform.OS === 'ios') {
      await AudioModule.setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: false,
      });
    }

    return uri ?? null;
  } catch {
    _recorder?.release();
    _recorder = null;
    return null;
  }
}

/** Cancel recording without saving (e.g. user dismissed). */
export async function cancelRecording(): Promise<void> {
  if (!_recorder) return;
  try {
    await _recorder.stop();
  } catch {
    // ignore
  } finally {
    _recorder?.release();
    _recorder = null;
  }
}
