/**
 * stt.service.ts
 * Speech-to-Text — proxied through backend to keep API keys off the client.
 * Backend endpoint: POST /ai-agent/transcribe (multipart/form-data, field: "file")
 */

import { API_BASE_URL } from '../constants/config';

export async function transcribe(audioUri: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  const res = await fetch(`${API_BASE_URL}/ai-agent/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Transcribe error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return (json.text as string).trim();
}
