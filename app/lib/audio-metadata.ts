/**
 * Audio metadata extraction using music-metadata
 * Pure computation, zero cost
 */

import { parseBuffer } from "music-metadata";
import { AudioMetadata } from "./types/audio-intelligence";

/**
 * Extract audio metadata from File
 * Converts File → Buffer → metadata (same pattern as whisper.ts)
 */
export async function extractAudioMetadata(file: File): Promise<AudioMetadata> {
  try {
    // Convert File to Buffer (same as whisper.ts:32-33)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse audio metadata
    const metadata = await parseBuffer(buffer, { mimeType: file.type });

    return {
      format: metadata.format.container || metadata.format.codec || "unknown",
      sampleRate: metadata.format.sampleRate || 0,
      channels: metadata.format.numberOfChannels || 0,
      bitrate: metadata.format.bitrate || 0,
    };
  } catch (error) {
    console.error("Audio metadata extraction error:", error);
    // Return default metadata on error
    return {
      format: "unknown",
      sampleRate: 0,
      channels: 0,
      bitrate: 0,
    };
  }
}
