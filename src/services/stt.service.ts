/**
 * stt.service.ts
 * Speech-to-Text interface — pluggable backend.
 *
 * Sprint 2 (current): mock transcript.
 * Sprint 3: swap PROVIDER to "whisper" or "google" and add API key to .env.
 *
 * Usage:
 *   const text = await transcribe(audioUri);
 */

type STTProvider = "mock" | "whisper" | "google";

// ── Change this to enable a real backend ──────────────────────────────────────
const PROVIDER: STTProvider = "mock";

// ── Mock ──────────────────────────────────────────────────────────────────────

async function transcribeMock(_uri: string): Promise<string> {
  // Simulate network latency so the UX feels real
  await new Promise((r) => setTimeout(r, 900));
  // Returns a fixed phrase so you can verify the NLU parser end-to-end
  return "Sinh nhật vợ ngày 5 tháng 3";
}

// ── OpenAI Whisper ────────────────────────────────────────────────────────────

async function transcribeWhisper(uri: string): Promise<string> {
  // Requires: EXPO_PUBLIC_OPENAI_KEY in .env
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_KEY;
  if (!apiKey) throw new Error("EXPO_PUBLIC_OPENAI_KEY not set");

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: "recording.m4a",
    type: "audio/m4a",
  } as unknown as Blob);
  formData.append("model", "whisper-1");
  formData.append("language", "vi");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`Whisper error ${res.status}`);
  const json = await res.json();
  return (json.text as string).trim();
}

// ── Google Cloud STT ──────────────────────────────────────────────────────────

async function transcribeGoogle(uri: string): Promise<string> {
  // Requires: EXPO_PUBLIC_GOOGLE_STT_KEY in .env
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_STT_KEY;
  if (!apiKey) throw new Error("EXPO_PUBLIC_GOOGLE_STT_KEY not set");

  // Read file as base64 (using legacy FileSystem API for compatibility)
  const { readAsStringAsync } = await import("expo-file-system/legacy");
  const base64 = await readAsStringAsync(uri, { encoding: "base64" });

  const body = {
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 44100,
      languageCode: "vi-VN",
      model: "latest_short",
    },
    audio: { content: base64 },
  };

  const res = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Google STT error ${res.status}`);
  const json = await res.json();
  const transcript = json.results?.[0]?.alternatives?.[0]?.transcript ?? "";
  return transcript.trim();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Convert an audio file URI to Vietnamese text.
 * Throws on network/permission errors — caller should handle gracefully.
 */
export async function transcribe(audioUri: string): Promise<string> {
  switch (PROVIDER) {
    case "whisper":
      return transcribeWhisper(audioUri);
    case "google":
      return transcribeGoogle(audioUri);
    case "mock":
    default:
      return transcribeMock(audioUri);
  }
}
