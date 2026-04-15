/**
 * recorder.service.ts
 * Wraps expo-audio AudioRecorder with a simple start/stop API.
 * Returns the local audio file URI on stop.
 */

import { AudioModule, AudioRecorder, RecordingPresets } from "expo-audio";
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

  await AudioModule.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  _recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
  await _recorder.prepareToRecordAsync();
  _recorder.record();
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

    // Reset audio mode so playback works normally afterwards
    await AudioModule.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
    });

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
