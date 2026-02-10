import { z } from "zod";
import { DiarizationSegment } from "@/app/lib/types/audio-intelligence";

const speakerEnum = z.enum(["Agent", "Customer"]);

const importedSegmentSchema = z.object({
  speaker: z.string().min(1),
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
});

export const normalizedTranscriptSchema = z.object({
  transcriptId: z.string().min(1),
  userId: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  segments: z.array(importedSegmentSchema).min(1),
});

export type ImportedSegment = z.infer<typeof importedSegmentSchema>;
export type NormalizedTranscriptPayload = z.infer<typeof normalizedTranscriptSchema>;

export interface PreparedImportData {
  transcriptId: string;
  source: string;
  metadata: Record<string, unknown>;
  segments: ImportedSegment[];
  content: string;
  durationSeconds: number;
  wordCount: number;
  avgConfidence: number | null;
  wordTimestamps: Array<{ word: string; start: number; end: number }>;
  diarizationSegments: DiarizationSegment[];
  speakerCount: number;
}

export function normalizeSpeaker(rawSpeaker: string): "Agent" | "Customer" {
  const normalized = rawSpeaker.trim().toLowerCase();
  const agentAliases = new Set([
    "agent",
    "representative",
    "rep",
    "collector",
    "advisor",
    "speaker_a",
    "speaker 1",
    "speaker_1",
    "speaker1",
    "person_1",
    "person 1",
    "person1",
    "spk_1",
    "a",
  ]);
  const customerAliases = new Set([
    "customer",
    "client",
    "debtor",
    "borrower",
    "consumer",
    "speaker_b",
    "speaker 2",
    "speaker_2",
    "speaker2",
    "person_2",
    "person 2",
    "person2",
    "spk_2",
    "b",
  ]);

  if (agentAliases.has(normalized)) return "Agent";
  if (customerAliases.has(normalized)) return "Customer";

  throw new Error(`Unsupported speaker label "${rawSpeaker}"`);
}

export function validateSegmentAlignment(segments: ImportedSegment[]): void {
  let previousEnd = 0;
  segments.forEach((segment, index) => {
    const speaker = normalizeSpeaker(segment.speaker);
    speakerEnum.parse(speaker);

    if (segment.end <= segment.start) {
      throw new Error(
        `Invalid segment timing at index ${index}: end (${segment.end}) must be greater than start (${segment.start})`
      );
    }

    if (index > 0 && segment.start < previousEnd) {
      throw new Error(
        `Segment overlap at index ${index}: start (${segment.start}) is before previous end (${previousEnd})`
      );
    }

    previousEnd = segment.end;
  });
}

function buildWordTimestamps(segments: ImportedSegment[]): Array<{ word: string; start: number; end: number }> {
  const words: Array<{ word: string; start: number; end: number }> = [];

  for (const segment of segments) {
    const segmentWords = segment.text.trim().split(/\s+/).filter(Boolean);
    if (segmentWords.length === 0) continue;

    const segmentDuration = Math.max(0.001, segment.end - segment.start);
    const perWord = segmentDuration / segmentWords.length;
    segmentWords.forEach((word, index) => {
      const start = segment.start + perWord * index;
      const end = index === segmentWords.length - 1 ? segment.end : start + perWord;
      words.push({ word, start, end });
    });
  }

  return words;
}

function buildContent(segments: ImportedSegment[]): string {
  return segments.map((segment) => `${normalizeSpeaker(segment.speaker)}: ${segment.text.trim()}`).join("\n");
}

function buildDiarization(segments: ImportedSegment[]): DiarizationSegment[] {
  return segments.map((segment) => ({
    speaker: normalizeSpeaker(segment.speaker),
    text: segment.text.trim(),
    start: segment.start,
    end: segment.end,
  }));
}

function roundConfidence(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function extractWordCount(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}

export function prepareImportedTranscript(
  payload: NormalizedTranscriptPayload,
  options?: { defaultSource?: string }
): PreparedImportData {
  validateSegmentAlignment(payload.segments);

  const source = payload.source || options?.defaultSource || "imported_normalized";
  const segments = payload.segments.map((segment) => ({
    ...segment,
    speaker: normalizeSpeaker(segment.speaker),
    text: segment.text.trim(),
  }));

  const content = buildContent(segments);
  const wordTimestamps = buildWordTimestamps(segments);
  const diarizationSegments = buildDiarization(segments);
  const durationSeconds = Math.max(1, Math.ceil(segments[segments.length - 1].end));
  const wordCount = extractWordCount(content);
  const confidenceValues = segments
    .map((segment) => segment.confidence)
    .filter((confidence): confidence is number => typeof confidence === "number");
  const avgConfidence =
    confidenceValues.length > 0
      ? roundConfidence(
          confidenceValues.reduce((sum, confidence) => sum + confidence, 0) / confidenceValues.length
        )
      : null;
  const speakerCount = new Set(segments.map((segment) => normalizeSpeaker(segment.speaker))).size;

  return {
    transcriptId: payload.transcriptId,
    source,
    metadata: payload.metadata || {},
    segments,
    content,
    durationSeconds,
    wordCount,
    avgConfidence,
    wordTimestamps,
    diarizationSegments,
    speakerCount,
  };
}

export interface MarkdownParseOptions {
  defaultSpeakerDurationSeconds?: number;
  fallbackConfidence?: number;
}

export interface CsvParseOptions {
  defaultSpeakerDurationSeconds?: number;
  fallbackConfidence?: number;
}

function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":").map((part) => Number(part.trim()));
  if (parts.some((part) => Number.isNaN(part))) {
    throw new Error(`Invalid timestamp "${timestamp}"`);
  }
  if (parts.length === 2) {
    const [mm, ss] = parts;
    return mm * 60 + ss;
  }
  if (parts.length === 3) {
    const [hh, mm, ss] = parts;
    return hh * 3600 + mm * 60 + ss;
  }
  throw new Error(`Unsupported timestamp format "${timestamp}"`);
}

function parseTimestampRange(raw: string): { start: number; end: number } | null {
  const match = raw.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)\]/);
  if (!match) return null;

  const start = parseTimestamp(match[1]);
  const end = parseTimestamp(match[2]);
  return { start, end };
}

export function parseSanitizedMarkdownTranscript(
  markdown: string,
  options?: MarkdownParseOptions
): ImportedSegment[] {
  const lines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const segments: ImportedSegment[] = [];

  let runningStart = 0;
  const defaultDuration = options?.defaultSpeakerDurationSeconds ?? 5;
  const fallbackConfidence = options?.fallbackConfidence ?? 0.95;

  for (const line of lines) {
    const timestampRange = parseTimestampRange(line);
    const cleanedLine = line.replace(/\[[^\]]+\]/g, "").trim();
    const speakerMatch = cleanedLine.match(/^([A-Za-z0-9_ ]+):\s+(.+)$/);
    if (!speakerMatch) continue;

    const speaker = normalizeSpeaker(speakerMatch[1]);
    const text = speakerMatch[2].trim();
    if (!text) continue;

    let start = runningStart;
    let end = runningStart + defaultDuration;

    if (timestampRange) {
      start = timestampRange.start;
      end = timestampRange.end;
    }

    if (end <= start) {
      end = start + defaultDuration;
    }

    segments.push({
      speaker,
      start,
      end,
      text,
      confidence: fallbackConfidence,
    });

    runningStart = end;
  }

  if (segments.length === 0) {
    throw new Error("No speaker-tagged lines were found in markdown");
  }

  return segments;
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        field += "\"";
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim().length > 0)) {
    rows.push(row);
  }

  return rows;
}

function parseOptionalNumber(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseSpeakerSentenceCsv(
  csv: string,
  options?: CsvParseOptions
): ImportedSegment[] {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) {
    throw new Error("CSV must include a header row and at least one transcript row");
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const getIndex = (candidates: string[]) =>
    headers.findIndex((header) => candidates.includes(header));

  const speakerIdx = getIndex(["person", "speaker", "agent", "customer"]);
  const textIdx = getIndex(["sentence", "text", "utterance", "content"]);
  const startIdx = getIndex(["start", "start_time", "starttime"]);
  const endIdx = getIndex(["end", "end_time", "endtime"]);
  const confidenceIdx = getIndex(["confidence", "conf"]);

  if (speakerIdx === -1 || textIdx === -1) {
    throw new Error("CSV must contain speaker/person and sentence/text columns");
  }

  const defaultDuration = options?.defaultSpeakerDurationSeconds ?? 5;
  const fallbackConfidence = options?.fallbackConfidence ?? 0.95;
  const segments: ImportedSegment[] = [];
  let runningStart = 0;

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const rawSpeaker = (row[speakerIdx] || "").trim();
    const text = (row[textIdx] || "").trim();
    if (!rawSpeaker || !text) continue;

    const speaker = normalizeSpeaker(rawSpeaker);
    const parsedStart = startIdx >= 0 ? parseOptionalNumber(row[startIdx]) : null;
    const parsedEnd = endIdx >= 0 ? parseOptionalNumber(row[endIdx]) : null;
    const parsedConfidence = confidenceIdx >= 0 ? parseOptionalNumber(row[confidenceIdx]) : null;

    let start = parsedStart ?? runningStart;
    let end = parsedEnd ?? start + defaultDuration;

    if (end <= start) {
      end = start + defaultDuration;
    }

    segments.push({
      speaker,
      start,
      end,
      text,
      confidence:
        parsedConfidence !== null
          ? Math.min(1, Math.max(0, parsedConfidence))
          : fallbackConfidence,
    });

    runningStart = end;
  }

  if (segments.length === 0) {
    throw new Error("No valid transcript rows found in CSV");
  }

  return segments;
}

export function buildNormalizedTranscriptExport(
  transcript: {
    id: string;
    userId: string;
    source: string;
    importMetadata: unknown;
    importedSegments: unknown;
  }
): NormalizedTranscriptPayload {
  const candidateSegments = Array.isArray(transcript.importedSegments)
    ? transcript.importedSegments
    : [];
  const parsedSegments = z.array(importedSegmentSchema).parse(candidateSegments);

  return {
    transcriptId: transcript.id,
    userId: transcript.userId,
    source: transcript.source || "imported_normalized",
    metadata: (transcript.importMetadata as Record<string, unknown>) || {},
    segments: parsedSegments,
  };
}

export function buildMarkdownExport(payload: NormalizedTranscriptPayload): string {
  const rows = payload.segments.map((segment) => {
    const start = formatSeconds(segment.start);
    const end = formatSeconds(segment.end);
    return `[${start}-${end}] ${normalizeSpeaker(segment.speaker)}: ${segment.text}`;
  });
  return rows.join("\n");
}

export function buildCsvExport(payload: NormalizedTranscriptPayload): string {
  const header = "Speaker,Start,End,Confidence,Sentence";
  const rows = payload.segments.map((segment) => {
    const speaker = escapeCsvValue(normalizeSpeaker(segment.speaker));
    const start = escapeCsvValue(segment.start.toString());
    const end = escapeCsvValue(segment.end.toString());
    const confidence = escapeCsvValue(
      typeof segment.confidence === "number" ? segment.confidence.toString() : ""
    );
    const sentence = escapeCsvValue(segment.text);
    return `${speaker},${start},${end},${confidence},${sentence}`;
  });
  return [header, ...rows].join("\n");
}

export function buildCsvExportFromTranscriptContent(
  content: string,
  durationSeconds?: number | null
): string {
  const header = "Speaker,Start,End,Confidence,Sentence";
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return header;
  }

  const parsedLines = lines
    .map((line) => {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (!match) return null;
      return { speaker: match[1].trim(), text: match[2].trim() };
    })
    .filter((line): line is { speaker: string; text: string } => Boolean(line));

  if (parsedLines.length === 0) {
    // Fallback: preserve full transcript as a single row if speaker labels are absent.
    return `${header}\nUnknown,,,,${escapeCsvValue(content.trim())}`;
  }

  const perLineDuration =
    durationSeconds && durationSeconds > 0
      ? durationSeconds / parsedLines.length
      : 5;
  const rows = parsedLines.map((line, index) => {
    const start = Number((index * perLineDuration).toFixed(3));
    const end = Number(((index + 1) * perLineDuration).toFixed(3));
    const speaker = escapeCsvValue(line.speaker);
    const sentence = escapeCsvValue(line.text);
    return `${speaker},${start},${end},,${sentence}`;
  });

  return [header, ...rows].join("\n");
}

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
